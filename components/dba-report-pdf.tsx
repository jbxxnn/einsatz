'use client'

import { Document, Page, Text, View, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer'
import { useState, useEffect } from 'react'
import type { Database } from '@/lib/database.types'

type DBAReport = Database['public']['Tables']['dba_reports']['Row']

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
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4
  },
  date: {
    fontSize: 12,
    color: '#9ca3af'
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
  scoreSection: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 8,
    marginBottom: 25
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: '8 16',
    borderRadius: 4,
    textAlign: 'center'
  },
  riskSafe: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  riskDoubtful: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  riskHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  },
  categorySection: {
    marginBottom: 20
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: '8 12',
    borderRadius: 4
  },
  questionRow: {
    marginBottom: 12,
    paddingLeft: 15
  },
  question: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 1.4
  },
  answer: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  legalSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fef2f2',
    border: '1 solid #fecaca',
    borderRadius: 8
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 10
  },
  legalText: {
    fontSize: 10,
    color: '#7f1d1d',
    lineHeight: 1.4
  },
  disclaimer: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic'
  }
})

interface DBAReportPDFProps {
  report: DBAReport
  bookingDetails?: {
    title: string
    description: string
    startDate: string
    endDate: string
    total: number
  }
  freelancerDetails?: {
    name: string
    email: string
  }
  clientDetails?: {
    name: string
    email: string
  }
}

function DBAReportPDF({ report, bookingDetails, freelancerDetails, clientDetails }: DBAReportPDFProps) {
  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return [styles.riskLevel, styles.riskSafe]
      case 'doubtful':
        return [styles.riskLevel, styles.riskDoubtful]
      case 'high_risk':
        return [styles.riskLevel, styles.riskHigh]
      default:
        return [styles.riskLevel, styles.riskDoubtful]
    }
  }

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'SAFE - Independent Contractor'
      case 'doubtful':
        return 'DOUBTFUL - Requires Review'
      case 'high_risk':
        return 'HIGH RISK - Employee Relationship'
      default:
        return 'UNKNOWN'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const reportData = report.answers_json as any

  // Safety check for categoryScores
  const categoryScores = reportData?.categoryScores || {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DBA Compliance Report</Text>
          <Text style={styles.subtitle}>Declaration of Labor Relations Assessment</Text>
          <Text style={styles.date}>Generated on {formatDate(report.created_at)}</Text>
        </View>

        {/* Booking Information */}
        {bookingDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Information</Text>
            <Text style={styles.subtitle}>Service: {bookingDetails.title}</Text>
            <Text style={styles.subtitle}>Period: {formatDate(bookingDetails.startDate)} - {formatDate(bookingDetails.endDate)}</Text>
            <Text style={styles.subtitle}>Total Value: €{bookingDetails.total}</Text>
          </View>
        )}

        {/* Compliance Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Compliance Assessment</Text>
          
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Overall Compliance Score:</Text>
            <Text style={styles.scoreValue}>{report.score}%</Text>
          </View>
          
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Risk Level:</Text>
            <Text style={getRiskLevelStyle(report.risk_level)}>
              {getRiskLevelText(report.risk_level)}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Analysis</Text>
          
          {Object.keys(categoryScores).length > 0 && Object.entries(categoryScores).map(([category, data]: [string, any]) => {
            if (data.max === 0) return null
            
            const percentage = Math.round((data.score / data.max) * 100)
            const categoryLabels: Record<string, string> = {
              control: 'Control & Supervision',
              substitution: 'Substitution Rights',
              tools: 'Tools & Equipment',
              risk: 'Financial Risk',
              economic_independence: 'Economic Independence'
            }
            
            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {categoryLabels[category] || category} - {percentage}%
                </Text>
                {data.answers && data.answers.slice(0, 3).map((answer: any, index: number) => (
                  <View key={index} style={styles.questionRow}>
                    <Text style={styles.question}>• {answer.question}</Text>
                    <Text style={styles.answer}>Answer: {answer.answer}</Text>
                  </View>
                ))}
                {data.answers && data.answers.length > 3 && (
                  <Text style={styles.answer}>... and {data.answers.length - 3} more questions</Text>
                )}
              </View>
            )
          })}
        </View>

        {/* Legal Summary */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Legal Implications</Text>
          <Text style={styles.legalText}>
            This DBA compliance report assesses the nature of the working relationship between the client and freelancer 
            under Dutch labor law. The assessment is based on the answers provided by both parties and evaluates five key 
            criteria: control and supervision, substitution rights, tools and equipment, financial risk, and economic independence.
          </Text>
          <Text style={styles.legalText}>
            {report.risk_level === 'safe' && 
              'This assessment indicates a low risk of employment relationship. The working arrangement appears to meet the criteria for independent contractor status under Dutch law.'
            }
            {report.risk_level === 'doubtful' && 
              'This assessment indicates moderate risk and requires careful review. Consider consulting with legal professionals to ensure compliance with Dutch labor law.'
            }
            {report.risk_level === 'high_risk' && 
              'This assessment indicates high risk of employment relationship. Immediate legal review is strongly recommended to avoid potential legal consequences.'
            }
          </Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This report is generated automatically based on the provided information and should not be considered as legal advice. 
          For legal certainty, please consult with qualified legal professionals. This assessment is valid as of the generation date 
          and may need to be updated if circumstances change.
        </Text>
      </Page>
    </Document>
  )
}

interface DBAReportPDFViewerProps {
  report: DBAReport
  bookingDetails?: {
    title: string
    description: string
    startDate: string
    endDate: string
    total: number
  }
  freelancerDetails?: {
    name: string
    email: string
  }
  clientDetails?: {
    name: string
    email: string
  }
  onDownload?: () => void
}

export default function DBAReportPDFViewer({ 
  report, 
  bookingDetails, 
  freelancerDetails, 
  clientDetails,
  onDownload 
}: DBAReportPDFViewerProps) {
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
        <DBAReportPDF 
          report={report}
          bookingDetails={bookingDetails}
          freelancerDetails={freelancerDetails}
          clientDetails={clientDetails}
        />
      </PDFViewer>
    </div>
  )
} 