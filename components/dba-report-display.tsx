'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Download, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useDBAReport } from '@/hooks/use-dba-report'
import DBAReportPDFViewer from './dba-report-pdf'
import type { Database } from '@/lib/database.types'

const CustomNoBookingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="50" 
  height="50" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M21.08 8.58v6.84c0 1.12-.6 2.16-1.57 2.73l-5.94 3.43c-.97.56-2.17.56-3.15 0l-5.94-3.43a3.15 3.15 0 0 1-1.57-2.73V8.58c0-1.12.6-2.16 1.57-2.73l5.94-3.43c.97-.56 2.17-.56 3.15 0l5.94 3.43c.97.57 1.57 1.6 1.57 2.73Z" 
    fill="currentColor">
      </path>
      <path d="M12 13.75c-.41 0-.75-.34-.75-.75V7.75c0-.41.34-.75.75-.75s.75.34.75.75V13c0 .41-.34.75-.75.75ZM12 17.249c-.13 0-.26-.03-.38-.08-.13-.05-.23-.12-.33-.21-.09-.1-.16-.21-.22-.33a.986.986 0 0 1-.07-.38c0-.26.1-.52.29-.71.1-.09.2-.16.33-.21.37-.16.81-.07 1.09.21.09.1.16.2.21.33.05.12.08.25.08.38s-.03.26-.08.38-.12.23-.21.33a.99.99 0 0 1-.71.29Z" 
      fill="currentColor">
        </path>
        </svg>
)

type DBAReport = Database['public']['Tables']['dba_reports']['Row']

interface DBAReportDisplayProps {
  bookingId: string
  freelancerId: string
  clientId: string
  jobCategoryId: string
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
  onReportGenerated?: (report: DBAReport) => void
}

export default function DBAReportDisplay({
  bookingId,
  freelancerId,
  clientId,
  jobCategoryId,
  bookingDetails,
  freelancerDetails,
  clientDetails,
  onReportGenerated
}: DBAReportDisplayProps) {
  const { t } = useTranslation()
  const { generateReport, getReportByBooking, loading, error } = useDBAReport()
  const [report, setReport] = useState<DBAReport | null>(null)
  const [showPDF, setShowPDF] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Load existing report on mount
  useEffect(() => {
    loadExistingReport()
  }, [bookingId])

  const loadExistingReport = async () => {
    const existingReport = await getReportByBooking(bookingId)
    if (existingReport) {
      setReport(existingReport)
      onReportGenerated?.(existingReport)
    }
  }

  const handleGenerateReport = async () => {
    const newReport = await generateReport({
      bookingId,
      freelancerId,
      clientId,
      jobCategoryId
    })

    if (newReport) {
      setReport(newReport)
      onReportGenerated?.(newReport)
    }
  }

  const handleDownloadPDF = async () => {
    if (!report) return
    
    setDownloading(true)
    try {
      // For now, we'll trigger the browser's print dialog for the PDF viewer
      // This is a simpler approach that works reliably
      setShowPDF(true)
      
      // Wait a moment for the PDF to load, then trigger print
      setTimeout(() => {
        const pdfViewer = document.querySelector('iframe[title="PDF viewer"]') as HTMLIFrameElement
        if (pdfViewer && pdfViewer.contentWindow) {
          pdfViewer.contentWindow.print()
        }
      }, 1000)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'doubtful':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high_risk':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle className="h-4 w-4" />
      case 'doubtful':
        return <AlertTriangle className="h-4 w-4" />
      case 'high_risk':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return t('dba.report.safe')
      case 'doubtful':
        return t('dba.report.doubtful')
      case 'high_risk':
        return t('dba.report.highRisk')
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && !report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Report</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadExistingReport} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CustomNoBookingsIcon className="h-5 w-5 text-primary" /> 
            <CardTitle className="text-sm text-black">{t('dba.report.title')}</CardTitle>
          </div>
          <CardDescription className="text-xs text-black">
            Generate a DBA compliance report for this booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Available</h3>
            <p className="text-gray-600 mb-4">
              Generate a DBA compliance report to assess the working relationship and compliance with Dutch labor law.
            </p>
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate DBA Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const reportData = report.answers_json as any

  // Safety check for categoryScores
  const categoryScores = reportData?.categoryScores || {}

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <CustomNoBookingsIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm text-black">{t('dba.report.title')}</CardTitle>
            </div>
            <div className="flex gap-2 mb-4">
              <Button
                // variant="outline"
                className="flex items-center gap-2 w-full"
                size="sm"
                onClick={() => setShowPDF(!showPDF)}
              >
                {showPDF ? 'Hide PDF' : 'View PDF'}
              </Button>
              {/* <Button
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Downloading...' : t('dba.report.download')}
              </Button> */}
            </div>
          </div>
          <CardDescription className="text-xs text-black">
            Generated on {formatDate(report.created_at)}
          </CardDescription>
        </CardHeader>
      </Card>


      {/* PDF Viewer */}
      {showPDF && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-black">DBA Compliance Report PDF</CardTitle>
            <CardDescription className="text-xs text-black">
              Professional PDF report with detailed analysis and legal summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DBAReportPDFViewer
              report={report}
              bookingDetails={bookingDetails}
              freelancerDetails={freelancerDetails}
              clientDetails={clientDetails}
            />
          </CardContent>
        </Card>
      )}

      {/* Score and Risk Level */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Compliance Score */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('dba.report.score')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Compliance Score</span>
                  <span className="text-lg font-bold">{report.score}%</span>
                </div>
                <Progress value={report.score} className="h-3" />
              </div>
            </div>

            {/* Risk Level */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('dba.report.riskLevel')}</h3>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${getRiskLevelColor(report.risk_level)}`}
              >
                {getRiskLevelIcon(report.risk_level)}
                {getRiskLevelText(report.risk_level)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(categoryScores).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-black">Category Analysis</CardTitle>
            <CardDescription className="text-xs text-black">
              Detailed breakdown of compliance scores by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryScores).map(([category, data]: [string, any]) => {
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
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-xs">{categoryLabels[category] || category}</span>
                      <span className="text-xs text-gray-600">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <Separator />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}


      

      {/* Regenerate Button */}
      {/* <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Need to update the report? Regenerate it with the latest information.
            </p>
            <Button onClick={handleGenerateReport} disabled={loading} variant="outline">
              {loading ? 'Regenerating...' : 'Regenerate Report'}
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
} 