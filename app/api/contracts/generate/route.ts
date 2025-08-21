import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    console.log('Contract API: Starting request processing')
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Contract API: Authentication failed', { authError, user: !!user })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Contract API: User authenticated', { userId: user.id })
    const { booking_id, contract_number, locale = 'en' } = await request.json()
    console.log('Contract API: Request data received', { booking_id, contract_number, locale })

    if (!booking_id || !contract_number) {
      return NextResponse.json({ error: 'Booking ID and contract number are required' }, { status: 400 })
    }

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
        hourly_rate,
        payment_method,
        location,
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

    console.log('Contract API: Starting PDF generation')
    const pdfBuffer = await generateContractPDF({
      booking: bookingData,
      contractNumber: contract_number,
      locale
    })

    console.log('Contract API: PDF generated successfully', { bufferSize: pdfBuffer.length })

    // Return PDF as response
    const response = new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${contract_number}-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

    console.log('Contract API: Response prepared successfully')
    return response

  } catch (error) {
    console.error('Contract API: Error occurred', error)
    return NextResponse.json({ 
      error: 'Failed to generate contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Contract PDF generator using jsPDF (serverless-compatible)
async function generateContractPDF(data: {
  booking: any
  contractNumber: string
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
    doc.text(isDutch ? 'Service Overeenkomst' : 'Service Agreement', 105, 30, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text(isDutch ? 'Onafhankelijke Aannemer Overeenkomst' : 'Independent Contractor Agreement', 105, 45, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Contract #${data.contractNumber}`, 105, 55, { align: 'center' })
    doc.text(`${isDutch ? 'Gegenereerd op' : 'Generated on'} ${new Date().toLocaleDateString(isDutch ? 'nl-NL' : 'en-US')}`, 105, 65, { align: 'center' })
    
    // Parties Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Partijen' : 'Parties', 20, 85)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${isDutch ? 'Opdrachtgever' : 'Client'}: ${data.booking.profiles?.first_name} ${data.booking.profiles?.last_name}`, 20, 100)
    doc.text(`${isDutch ? 'Freelancer' : 'Freelancer'}: ${data.booking.freelancer?.first_name} ${data.booking.freelancer?.last_name}`, 20, 110)
    
    // Service Details Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Service Details' : 'Service Details', 20, 135)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${isDutch ? 'Beschrijving' : 'Description'}: ${data.booking.description || 'No description provided'}`, 20, 150)
    doc.text(`${isDutch ? 'Datum' : 'Date'}: ${new Date(data.booking.start_time).toLocaleDateString(isDutch ? 'nl-NL' : 'en-US')}`, 20, 160)
    doc.text(`${isDutch ? 'Tijd' : 'Time'}: ${new Date(data.booking.start_time).toLocaleTimeString(isDutch ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(data.booking.end_time).toLocaleTimeString(isDutch ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`, 20, 170)
    doc.text(`${isDutch ? 'Locatie' : 'Location'}: ${data.booking.location || 'Not specified'}`, 20, 180)
    doc.text(`${isDutch ? 'Uurtarief' : 'Hourly Rate'}: €${data.booking.hourly_rate.toFixed(2)}`, 20, 190)
    doc.text(`${isDutch ? 'Totaal Bedrag' : 'Total Amount'}: €${data.booking.total_amount.toFixed(2)}`, 20, 200)
    
    // Terms and Conditions Section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(isDutch ? 'Voorwaarden' : 'Terms and Conditions', 20, 225)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`1. ${isDutch ? 'Onafhankelijke Aannemer Status' : 'Independent Contractor Status'}`, 20, 240)
    doc.setFontSize(10)
    doc.text(isDutch ? 'De freelancer is een onafhankelijke aannemer en geen werknemer van de opdrachtgever.' : 'The freelancer is an independent contractor and not an employee of the client.', 25, 250)
    
    doc.setFontSize(12)
    doc.text(`2. ${isDutch ? 'Betaling' : 'Payment'}`, 20, 265)
    doc.setFontSize(10)
    doc.text(isDutch ? `Betaling van €${data.booking.total_amount.toFixed(2)} is verschuldigd bij voltooiing van de diensten.` : `Payment of €${data.booking.total_amount.toFixed(2)} is due upon completion of services.`, 25, 275)
    
    doc.setFontSize(12)
    doc.text(`3. ${isDutch ? 'Intellectueel Eigendom' : 'Intellectual Property'}`, 20, 290)
    doc.setFontSize(10)
    doc.text(isDutch ? 'Alle intellectuele eigendom blijft bij de freelancer, tenzij anders overeengekomen.' : 'All intellectual property remains with the freelancer unless otherwise agreed.', 25, 300)
    
    // Footer
    doc.setFontSize(10)
    doc.text(isDutch ? 'Einsatz Platform - Service Overeenkomst' : 'Einsatz Platform - Service Agreement', 105, 320, { align: 'center' })
    doc.text(`${isDutch ? 'Gegenereerd op' : 'Generated on'}: ${new Date().toLocaleDateString()}`, 105, 330, { align: 'center' })
    
    // Return PDF as buffer
    return Buffer.from(doc.output('arraybuffer'))
  } catch (error) {
    console.error('Contract API: PDF generation error:', error)
    throw error
  }
}

// GET endpoint for testing
export async function GET() {
  try {
    console.log('Contract API: GET endpoint called - testing route accessibility')
    return NextResponse.json({ 
      message: 'Contract Generator API is working',
      timestamp: new Date().toISOString(),
      status: 'ok'
    })
  } catch (error) {
    console.error('Contract API: GET endpoint error', error)
    return NextResponse.json({ error: 'GET endpoint failed' }, { status: 500 })
  }
}

