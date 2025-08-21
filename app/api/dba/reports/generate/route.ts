import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

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

// PDF report generator using Puppeteer
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
  let browser: any = null
  try {
    const isDutch = data.locale === 'nl'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 5px; }
          .date { font-size: 12px; color: #9ca3af; }
          .section { margin-bottom: 25px; }
          .sectionTitle { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .scoreCard { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
          .scoreRow { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .scoreLabel { font-size: 14px; color: #374151; font-weight: bold; }
          .scoreValue { font-size: 16px; font-weight: bold; }
          .riskLevel { font-size: 14px; padding: 8px 12px; border-radius: 4px; text-align: center; font-weight: bold; }
          .riskSafe { background-color: #dcfce7; color: #166534; }
          .riskDoubtful { background-color: #fef3c7; color: #92400e; }
          .riskHigh { background-color: #fee2e2; color: #991b1b; }
          .questionItem { margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }
          .questionText { font-size: 12px; color: #1f2937; margin-bottom: 8px; font-weight: bold; }
          .answerText { font-size: 11px; color: #6b7280; font-style: italic; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${isDutch ? 'DBA Compliance Rapport' : 'DBA Compliance Report'}</div>
          <div class="subtitle">${isDutch ? 'Declaratie van Arbeidsrelatie' : 'Declaration of Labor Relations'}</div>
          <div class="date">${new Date().toLocaleDateString(isDutch ? 'nl-NL' : 'en-US')}</div>
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Boeking Informatie' : 'Booking Information'}</div>
          <div class="scoreCard">
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Boeking ID' : 'Booking ID'}</span>
              <span class="scoreValue">${data.bookingId}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Freelancer' : 'Freelancer'}</span>
              <span class="scoreValue">${data.freelancerName}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Opdrachtgever' : 'Client'}</span>
              <span class="scoreValue">${data.clientName}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Werkcategorie' : 'Job Category'}</span>
              <span class="scoreValue">${data.jobCategory}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Compliance Score' : 'Compliance Score'}</div>
          <div class="scoreCard">
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Totale Score' : 'Overall Score'}</span>
              <span class="scoreValue">${data.score}%</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Risico Niveau' : 'Risk Level'}</span>
              <span class="scoreValue ${data.riskLevel === 'safe' ? 'riskSafe' : data.riskLevel === 'doubtful' ? 'riskDoubtful' : 'riskHigh'}">${data.riskLevel.toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Categorie Scores' : 'Category Scores'}</div>
          ${Object.entries(data.categoryScores).map(([category, score]) => `
            <div class="scoreCard">
              <div class="scoreRow">
                <span class="scoreLabel">${category}</span>
                <span class="scoreValue">${score}%</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Gedetailleerde Antwoorden' : 'Detailed Answers'}</div>
          ${data.clientAnswers.map((answer, index) => `
            <div class="questionItem">
              <div class="questionText">${index + 1}. ${answer.dba_questions?.question_text || `Question ${index + 1}`}</div>
              <div class="answerText">${isDutch ? 'Antwoord' : 'Answer'}: ${answer.answer_value || `Option ${answer.selected_option_index + 1}`}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <div>${isDutch ? 'Gegenereerd op' : 'Generated on'}: ${new Date().toLocaleDateString()}</div>
          <div>Einsatz Platform - DBA Compliance Report</div>
        </div>
      </body>
      </html>
    `
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage()
    await page.setContent(html)
    const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } })
    
    return Buffer.from(pdf)
  } catch (error) {
    console.error('DBA Report API: PDF generation error:', error)
    throw error
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('DBA Report API: Error closing browser:', closeError)
      }
    }
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
