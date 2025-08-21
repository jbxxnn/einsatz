import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

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

// Contract PDF generator using Puppeteer
async function generateContractPDF(data: {
  booking: any
  contractNumber: string
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
          .questionItem { margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }
          .questionText { font-size: 12px; color: #1f2937; margin-bottom: 8px; font-weight: bold; }
          .answerText { font-size: 11px; color: #6b7280; font-style: italic; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${isDutch ? 'Service Overeenkomst' : 'Service Agreement'}</div>
          <div class="subtitle">${isDutch ? 'Onafhankelijke Aannemer Overeenkomst' : 'Independent Contractor Agreement'}</div>
          <div class="date">Contract #${data.contractNumber}</div>
          <div class="date">${isDutch ? 'Gegenereerd op' : 'Generated on'} ${new Date().toLocaleDateString(isDutch ? 'nl-NL' : 'en-US')}</div>
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Partijen' : 'Parties'}</div>
          
          <div class="scoreCard">
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Opdrachtgever' : 'Client'}</span>
              <span class="scoreValue">${data.booking.profiles?.first_name} ${data.booking.profiles?.last_name}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Freelancer' : 'Freelancer'}</span>
              <span class="scoreValue">${data.booking.freelancer?.first_name} ${data.booking.freelancer?.last_name}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Service Details' : 'Service Details'}</div>
          
          <div class="scoreCard">
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Beschrijving' : 'Description'}</span>
              <span class="scoreValue">${data.booking.description || 'No description provided'}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Datum' : 'Date'}</span>
              <span class="scoreValue">${new Date(data.booking.start_time).toLocaleDateString(isDutch ? 'nl-NL' : 'en-US')}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Tijd' : 'Time'}</span>
              <span class="scoreValue">
                ${new Date(data.booking.start_time).toLocaleTimeString(isDutch ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - 
                ${new Date(data.booking.end_time).toLocaleTimeString(isDutch ? 'nl-NL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Locatie' : 'Location'}</span>
              <span class="scoreValue">${data.booking.location || 'Not specified'}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Uurtarief' : 'Hourly Rate'}</span>
              <span class="scoreValue">€${data.booking.hourly_rate.toFixed(2)}</span>
            </div>
            <div class="scoreRow">
              <span class="scoreLabel">${isDutch ? 'Totaal Bedrag' : 'Total Amount'}</span>
              <span class="scoreValue">€${data.booking.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="sectionTitle">${isDutch ? 'Voorwaarden' : 'Terms and Conditions'}</div>
          
          <div class="questionItem">
            <div class="questionText">1. ${isDutch ? 'Onafhankelijke Aannemer Status' : 'Independent Contractor Status'}</div>
            <div class="answerText">
              ${isDutch ? 'De freelancer is een onafhankelijke aannemer en geen werknemer van de opdrachtgever.' : 'The freelancer is an independent contractor and not an employee of the client.'}
            </div>
          </div>
          
          <div class="questionItem">
            <div class="questionText">2. ${isDutch ? 'Betaling' : 'Payment'}</div>
            <div class="answerText">
              ${isDutch ? 'Betaling van €' + data.booking.total_amount.toFixed(2) + ' is verschuldigd bij voltooiing van de diensten.' : 'Payment of €' + data.booking.total_amount.toFixed(2) + ' is due upon completion of services.'}
            </div>
          </div>
          
          <div class="questionItem">
            <div class="questionText">3. ${isDutch ? 'Intellectueel Eigendom' : 'Intellectual Property'}</div>
            <div class="answerText">
              ${isDutch ? 'Alle intellectuele eigendom blijft bij de freelancer, tenzij anders overeengekomen.' : 'All intellectual property remains with the freelancer unless otherwise agreed.'}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>${isDutch ? 'Einsatz Platform - Service Overeenkomst' : 'Einsatz Platform - Service Agreement'}</div>
          <div>${isDutch ? 'Gegenereerd op' : 'Generated on'}: ${new Date().toLocaleDateString()}</div>
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
    console.error('Contract API: PDF generation error:', error)
    throw error
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Contract API: Error closing browser:', closeError)
      }
    }
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
