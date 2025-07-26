'use client'

import { Document, Page, Text, View, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer'
import { useState, useEffect } from 'react'
import type { Database } from '@/lib/database.types'

type DBAReport = Database['public']['Tables']['dba_reports']['Row']
type Booking = Database['public']['Tables']['bookings']['Row'] & {
  freelancer: Database['public']['Tables']['profiles']['Row']
  client: Database['public']['Tables']['profiles']['Row']
}

// Use built-in fonts for reliability
// No need to register fonts - react-pdf has built-in support for Helvetica, Times, etc.

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #1f2937',
    paddingBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center'
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center'
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 8
  },
  partySection: {
    marginBottom: 20
  },
  partyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  partyInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  termsSection: {
    marginBottom: 20
  },
  termItem: {
    marginBottom: 12
  },
  termLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4
  },
  termValue: {
    fontSize: 11,
    color: '#6b7280'
  },
  dbaSection: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  dbaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10
  },
  dbaScore: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4
  },
  dbaRisk: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8
  },
  riskSafe: {
    color: '#166534'
  },
  riskDoubtful: {
    color: '#92400e'
  },
  riskHigh: {
    color: '#991b1b'
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signatureBox: {
    width: '45%',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 20
  },
  signatureLine: {
    borderBottom: '1 solid #000',
    height: 20
  },
  footer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4
  },
  disclaimer: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
  }
})

interface ContractPDFProps {
  booking: Booking
  dbaReport?: DBAReport
  contractNumber: string
}

function ContractPDF({ booking, dbaReport, contractNumber }: ContractPDFProps) {
  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'SAFE - Independent Contractor Relationship'
      case 'doubtful':
        return 'DOUBTFUL - Requires Review'
      case 'high_risk':
        return 'HIGH RISK - Employee Relationship'
      default:
        return 'UNKNOWN'
    }
  }

  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return styles.riskSafe
      case 'doubtful':
        return styles.riskDoubtful
      case 'high_risk':
        return styles.riskHigh
      default:
        return styles.riskDoubtful
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = () => {
    const start = new Date(booking.start_time)
    const end = new Date(booking.end_time)
    const durationMs = end.getTime() - start.getTime()
    const hours = durationMs / (1000 * 60 * 60)
    return hours.toFixed(1)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Service Agreement</Text>
          <Text style={styles.subtitle}>Independent Contractor Agreement</Text>
          <Text style={styles.date}>Contract #{contractNumber}</Text>
          <Text style={styles.date}>Generated on {formatDate(new Date().toISOString())}</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          
          <View style={styles.partySection}>
            <Text style={styles.partyTitle}>Client</Text>
            <Text style={styles.partyInfo}>
              {booking.client?.first_name} {booking.client?.last_name}
            </Text>
            <Text style={styles.partyInfo}>Client ID: {booking.client_id.substring(0, 8)}</Text>
          </View>

          <View style={styles.partySection}>
            <Text style={styles.partyTitle}>Freelancer</Text>
            <Text style={styles.partyInfo}>
              {booking.freelancer?.first_name} {booking.freelancer?.last_name}
            </Text>
            <Text style={styles.partyInfo}>Freelancer ID: {booking.freelancer_id.substring(0, 8)}</Text>
            <Text style={styles.partyInfo}>Hourly Rate: €{booking.hourly_rate.toFixed(2)}</Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          
          <View style={styles.termsSection}>
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Service Description:</Text>
              <Text style={styles.termValue}>{booking.description || 'No description provided'}</Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Date:</Text>
              <Text style={styles.termValue}>{formatDate(booking.start_time)}</Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Time:</Text>
              <Text style={styles.termValue}>
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Duration:</Text>
              <Text style={styles.termValue}>{calculateDuration()} hours</Text>
            </View>

            {booking.location && (
              <View style={styles.termItem}>
                <Text style={styles.termLabel}>Location:</Text>
                <Text style={styles.termValue}>{booking.location}</Text>
              </View>
            )}

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Total Amount:</Text>
              <Text style={styles.termValue}>€{booking.total_amount.toFixed(2)}</Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Payment Method:</Text>
              <Text style={styles.termValue}>
                {booking.payment_method === 'offline' ? 'Offline Payment' : 'Online Payment'}
              </Text>
            </View>
          </View>
        </View>

        {/* DBA Compliance Section */}
        {dbaReport && (
          <View style={styles.dbaSection}>
            <Text style={styles.dbaTitle}>DBA Compliance Assessment</Text>
            <Text style={styles.dbaScore}>
              Compliance Score: {dbaReport.score}%
            </Text>
            <Text style={[styles.dbaRisk, getRiskLevelStyle(dbaReport.risk_level)]}>
              Risk Level: {getRiskLevelText(dbaReport.risk_level)}
            </Text>
            <Text style={styles.termValue}>
              This assessment indicates the nature of the working relationship under Dutch labor law. 
              The score is based on answers provided by both parties regarding control, substitution rights, 
              tools, financial risk, and economic independence.
            </Text>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          
          <View style={styles.termsSection}>
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>1. Independent Contractor Status</Text>
              <Text style={styles.termValue}>
                The freelancer is an independent contractor and not an employee of the client. 
                This agreement does not create an employment relationship.
              </Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>2. Payment Terms</Text>
              <Text style={styles.termValue}>
                Payment of €{booking.total_amount.toFixed(2)} is due upon completion of services. 
                Payment method: {booking.payment_method === 'offline' ? 'Offline payment as agreed' : 'Online payment through platform'}.
              </Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>3. Cancellation Policy</Text>
              <Text style={styles.termValue}>
                Cancellations must be made at least 24 hours before the scheduled start time. 
                Late cancellations may result in partial charges.
              </Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>4. Liability</Text>
              <Text style={styles.termValue}>
                Each party is responsible for their own actions and any damages caused during the service provision. 
                The platform facilitates the connection but is not liable for service outcomes.
              </Text>
            </View>

            <View style={styles.termItem}>
              <Text style={styles.termLabel}>5. Dispute Resolution</Text>
              <Text style={styles.termValue}>
                Any disputes arising from this agreement should first be resolved through the platform's 
                dispute resolution process before seeking external legal action.
              </Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Client Signature</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Freelancer Signature</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Important Information</Text>
          <Text style={styles.footerText}>
            This contract is generated automatically by the Einsatz platform. Both parties acknowledge 
            that they have read and agree to the terms outlined in this agreement. The DBA compliance 
            assessment is provided for informational purposes and should not be considered as legal advice.
          </Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This document is generated electronically and is legally binding. For legal certainty, 
          please consult with qualified legal professionals if you have any questions about this agreement.
        </Text>
      </Page>
    </Document>
  )
}

interface ContractPDFViewerProps {
  booking: Booking
  dbaReport?: DBAReport
  contractNumber: string
  onDownload?: () => void
}

export default function ContractPDFViewer({ 
  booking, 
  dbaReport, 
  contractNumber,
  onDownload 
}: ContractPDFViewerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        <ContractPDF 
          booking={booking}
          dbaReport={dbaReport}
          contractNumber={contractNumber}
        />
      </PDFViewer>
    </div>
  )
} 