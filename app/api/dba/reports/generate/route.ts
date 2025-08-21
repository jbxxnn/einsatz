import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    console.log('DBA Report API: Starting request processing')
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('DBA Report API: Authentication failed', { authError, user: !!user })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('DBA Report API: User authenticated', { userId: user.id })
    const { booking_id, locale = 'en', dba_data } = await request.json()
    console.log('DBA Report API: Request data received', { booking_id: !!booking_id, locale, hasDbaData: !!dba_data })

    if (!booking_id && !dba_data) {
      return NextResponse.json({ error: 'Either booking ID or DBA data is required' }, { status: 400 })
    }

    let booking: any = null
    let clientAnswers: any[] = []
    let freelancerAnswers: any[] = []

    if (booking_id && !dba_data) {
      // Get booking details from database
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          total_amount,
          category_id,
          client_id,
          freelancer_id,
          profiles!bookings_client_id_fkey(first_name, last_name, email),
          freelancer:profiles!bookings_freelancer_id_fkey(first_name, last_name, email),
          job_categories(name)
        `)
        .eq('id', booking_id)
        .single()

      if (bookingError || !bookingData) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Verify user has access to this booking
      if (bookingData.client_id !== user.id && bookingData.freelancer_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized access to this booking' }, { status: 403 })
      }

      booking = bookingData

      // Get client DBA answers from database
      const { data: clientAnswersData, error: clientAnswersError } = await supabase
        .from('client_dba_answers')
        .select(`
          question_id,
          selected_option_index,
          answer_score,
          dba_questions!client_dba_answers_question_id_fkey(
            question_text,
            category,
            options_json
          )
        `)
        .eq('booking_id', booking_id)

      if (clientAnswersError) {
        console.error('Error fetching client answers:', clientAnswersError)
        return NextResponse.json({ error: 'Failed to fetch client answers' }, { status: 500 })
      }

      clientAnswers = clientAnswersData || []

      // Get freelancer DBA answers for this category
      const { data: freelancerAnswersData, error: freelancerAnswersError } = await supabase
        .from('freelancer_dba_answers')
        .select(`
          question_id,
          selected_option_index,
          answer_score,
          dba_questions!freelancer_dba_answers_question_id_fkey(
            question_text,
            category,
            options_json
          )
        `)
        .eq('freelancer_id', booking.freelancer_id)
        .eq('job_category_id', booking.category_id)

      if (freelancerAnswersError) {
        console.error('Error fetching freelancer answers:', freelancerAnswersError)
        // Continue without freelancer answers
      }

      freelancerAnswers = freelancerAnswersData || []

      // Process answers to add answer_value from options_json
      clientAnswers = clientAnswers.map(answer => ({
        ...answer,
        answer_value: answer.dba_questions?.options_json?.[answer.selected_option_index] || `Option ${answer.selected_option_index + 1}`
      }))

      freelancerAnswers = freelancerAnswers.map(answer => ({
        ...answer,
        answer_value: answer.dba_questions?.options_json?.[answer.selected_option_index] || `Option ${answer.selected_option_index + 1}`
      }))

      console.log('DBA Report API: Processed answers', { 
        clientAnswersCount: clientAnswers.length, 
        freelancerAnswersCount: freelancerAnswers.length,
        sampleClientAnswer: clientAnswers[0]
      })
    } else if (dba_data) {
      // Use provided DBA data for pre-booking reports
      booking = {
        id: booking_id || 'pre-booking',
        title: 'DBA Assessment Report',
        description: 'Pre-booking DBA compliance assessment',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        total_amount: 0,
        category_id: null,
        client_id: user.id,
        freelancer_id: null,
        profiles: { first_name: user.user_metadata?.first_name || 'Client', last_name: user.user_metadata?.last_name || '' },
        freelancer: { first_name: 'Freelancer', last_name: '' },
        job_categories: { name: 'General' }
      }

      // Convert DBA data to the format expected by the PDF generator
      clientAnswers = dba_data.answers?.map((answer: any, index: number) => ({
        id: answer.question_id || index + 1,
        question_id: answer.question_id || index + 1,
        selected_option_index: answer.selected_option_index,
        answer_score: answer.answer_score,
        answer_value: answer.answer_value || `Option ${answer.selected_option_index + 1}`,
        dba_questions: {
          question_text: answer.question_text || `Question ${index + 1}`,
          category: answer.category || 'general',
          options_json: answer.options_json || ['Option 1', 'Option 2', 'Option 3']
        }
      })) || []

      freelancerAnswers = []
    }

    // Calculate scores
    const clientTotalScore = clientAnswers?.reduce((sum, answer) => sum + answer.answer_score, 0) || 0
    const freelancerTotalScore = freelancerAnswers?.reduce((sum, answer) => sum + answer.answer_score, 0) || 0
    
    // Calculate combined score (simple average for now)
    const combinedScore = freelancerAnswers && freelancerAnswers.length > 0 
      ? Math.round(((clientTotalScore + freelancerTotalScore) / 2) * 10) / 10
      : clientTotalScore

    // Determine risk level
    let riskLevel: 'safe' | 'doubtful' | 'high_risk' = 'safe'
    if (combinedScore > 60) riskLevel = 'high_risk'
    else if (combinedScore > 30) riskLevel = 'doubtful'

    // Calculate category scores
    const categoryScores: Record<string, { total: number; count: number }> = {}
    const allAnswers = [...(clientAnswers || []), ...(freelancerAnswers || [])]
    
    allAnswers.forEach(answer => {
      const category = answer.dba_questions?.category
      if (category) {
        if (!categoryScores[category]) {
          categoryScores[category] = { total: 0, count: 0 }
        }
        categoryScores[category].total += answer.answer_score
        categoryScores[category].count += 1
      }
    })

    // Convert to percentages
    const finalCategoryScores: Record<string, number> = {}
    Object.keys(categoryScores).forEach(category => {
      const avg = categoryScores[category].total / categoryScores[category].count
      finalCategoryScores[category] = Math.round((avg / 10) * 100)
    })

         // Generate actual PDF report
    console.log('DBA Report API: Starting PDF generation')
    const pdfBuffer = await generatePDFReport({
      bookingId: booking.id,
      freelancerName: `${booking.freelancer?.first_name || ''} ${booking.freelancer?.last_name || ''}`.trim(),
      clientName: `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim(),
      jobCategory: booking.job_categories?.name || 'Unknown',
      score: combinedScore,
      riskLevel,
      categoryScores: finalCategoryScores,
      clientAnswers,
      locale
    })

    console.log('DBA Report API: PDF generated successfully', { bufferSize: pdfBuffer.length })

    // Return PDF as response
    const response = new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dba-report-${booking.id}-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

    console.log('DBA Report API: Response prepared successfully')
    return response

  } catch (error) {
    console.error('DBA Report API: Error occurred', error)
    return NextResponse.json({ 
      error: 'Failed to generate DBA report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PDF report generator using jsPDF (serverless-compatible)
async function generatePDFReport(data: {
  bookingId: string
  freelancerName: string
  clientName: string
  jobCategory: string
  score: number
  riskLevel: string
  categoryScores: Record<string, number>
  clientAnswers: any[]
  locale: string
}): Promise<Buffer> {
  try {
    const isDutch = data.locale === 'nl'
    
    // Create new PDF document
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica')
    
    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'DBA Compliance Rapport' : 'DBA Compliance Report', 105, 30, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text(isDutch ? 'Declaratie van Arbeidsrelatie' : 'Declaration of Labor Relations', 105, 45, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(new Date().toLocaleDateString(isDutch ? 'nl-NL' : 'en-US'), 105, 55, { align: 'center' })
    
    // Booking Information Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Boeking Informatie' : 'Booking Information', 20, 75)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${isDutch ? 'Boeking ID' : 'Booking ID'}: ${data.bookingId}`, 20, 90)
    doc.text(`${isDutch ? 'Freelancer' : 'Freelancer'}: ${data.freelancerName}`, 20, 100)
    doc.text(`${isDutch ? 'Opdrachtgever' : 'Client'}: ${data.clientName}`, 20, 110)
    doc.text(`${isDutch ? 'Werkcategorie' : 'Job Category'}: ${data.jobCategory}`, 20, 120)
    
    // Compliance Score Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Compliance Score' : 'Compliance Score', 20, 145)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${isDutch ? 'Totale Score' : 'Overall Score'}: ${data.score}%`, 20, 160)
    
    // Risk level with color coding
    const riskText = data.riskLevel.toUpperCase()
    const riskY = 170
    doc.text(`${isDutch ? 'Risico Niveau' : 'Risk Level'}: `, 20, riskY)
    
    // Set color based on risk level
    if (data.riskLevel === 'safe') {
      doc.setTextColor(22, 101, 52) // Green
    } else if (data.riskLevel === 'doubtful') {
      doc.setTextColor(146, 64, 14) // Amber
    } else {
      doc.setTextColor(153, 27, 27) // Red
    }
    doc.text(riskText, 60, riskY)
    doc.setTextColor(0, 0, 0) // Reset to black
    
    // Category Scores Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Categorie Scores' : 'Category Scores', 20, 195)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    let categoryY = 210
    Object.entries(data.categoryScores).forEach(([category, score]) => {
      doc.text(`${category}: ${score}%`, 20, categoryY)
      categoryY += 10
    })
    
    // Detailed Answers Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Gedetailleerde Antwoorden' : 'Detailed Answers', 20, categoryY + 10)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    let answerY = categoryY + 25
    
    data.clientAnswers.forEach((answer, index) => {
      const questionText = answer.dba_questions?.question_text || `Question ${index + 1}`
      const answerText = answer.answer_value || `Option ${answer.selected_option_index + 1}`
      
      // Check if we need a new page
      if (answerY > 250) {
        doc.addPage()
        answerY = 20
      }
      
      // Question text (bold)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${questionText}`, 20, answerY)
      answerY += 8
      
      // Answer text (normal)
      doc.setFont('helvetica', 'normal')
      doc.text(`${isDutch ? 'Antwoord' : 'Answer'}: ${answerText}`, 25, answerY)
      answerY += 15
    })
    
    // Footer
    doc.setFontSize(10)
    doc.text(`${isDutch ? 'Gegenereerd op' : 'Generated on'}: ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' })
    doc.text('Einsatz Platform - DBA Compliance Report', 105, 290, { align: 'center' })
    
    // Return PDF as buffer
    return Buffer.from(doc.output('arraybuffer'))
  } catch (error) {
    console.error('DBA Report API: PDF generation error:', error)
    throw error
  }
}

// GET endpoint for testing
export async function GET() {
  try {
    console.log('DBA Report API: GET endpoint called - testing route accessibility')
    return NextResponse.json({ 
      message: 'DBA Report Generator API is working',
      timestamp: new Date().toISOString(),
      status: 'ok'
    })
  } catch (error) {
    console.error('DBA Report API: GET endpoint error', error)
    return NextResponse.json({ error: 'GET endpoint failed' }, { status: 500 })
  }
}
