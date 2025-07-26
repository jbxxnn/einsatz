'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Download, Eye, Loader } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useContract } from '@/hooks/use-contract'
import { useDBAReport } from '@/hooks/use-dba-report'
import { toast } from '@/hooks/use-toast'
import ContractPDFViewer from './contract-pdf'
import type { Database } from '@/lib/database.types'

type DBAReport = Database['public']['Tables']['dba_reports']['Row']
type Booking = Database['public']['Tables']['bookings']['Row'] & {
  freelancer: Database['public']['Tables']['profiles']['Row']
  client: Database['public']['Tables']['profiles']['Row']
}

interface ContractDisplayProps {
  booking: Booking
  onContractGenerated?: (contractNumber: string) => void
}

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

export default function ContractDisplay({
  booking,
  onContractGenerated
}: ContractDisplayProps) {
  const { t } = useTranslation()
  const { generateContract, downloadContract, loading: contractLoading } = useContract()
  const { getReportByBooking, loading: reportLoading } = useDBAReport()
  const [dbaReport, setDbaReport] = useState<DBAReport | null>(null)
  const [showContract, setShowContract] = useState(false)
  const [contractNumber, setContractNumber] = useState<string>('')
  const [downloading, setDownloading] = useState(false)

  // Load existing DBA report on mount
  useEffect(() => {
    loadDBAReport()
  }, [booking.id])

  const loadDBAReport = async () => {
    const report = await getReportByBooking(booking.id)
    if (report) {
      setDbaReport(report)
      // If report has contract URL, extract contract number
      if (report.contract_pdf_url) {
        const urlParts = report.contract_pdf_url.split('/')
        const filename = urlParts[urlParts.length - 1]
        const contractNum = filename.replace('.pdf', '')
        setContractNumber(contractNum)
      }
    }
  }

  const handleGenerateContract = async () => {
    const result = await generateContract(booking, dbaReport || undefined)
    
    if (result.success) {
      setContractNumber(result.contractNumber)
      onContractGenerated?.(result.contractNumber)
      toast({
        title: "Contract Generated",
        description: `Contract ${result.contractNumber} has been generated successfully.`,
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to generate contract. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleViewContract = () => {
    setShowContract(true)
  }

  const handleDownloadContract = async () => {
    setDownloading(true)
    try {
      await downloadContract(booking, dbaReport || undefined)
    } finally {
      setDownloading(false)
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

  if (reportLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Contract Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4">
            <div className="flex items-center gap-2">
              <CustomNoBookingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>{t('contract.title')}</CardTitle>
            </div>
            {contractNumber && (
              // <Badge variant="outline" className="text-sm ">
              <div>
                {contractNumber}
              </div>
              // </Badge>
            )}
          </div>
          <CardDescription>
            {t('contract.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Contract Status */}
      {!contractNumber ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col text-center justify-center py-8">
              <CustomNoBookingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('contract.noContract')}</h3>
              <p className="text-gray-600 mb-4">
                {t('contract.noContractDescription')}
              </p>
              <Button 
                onClick={handleGenerateContract} 
                disabled={contractLoading}
                className="flex items-center gap-2"
              >
                {contractLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    {t('contract.generating')}
                  </>
                ) : (
                  <>
                    <CustomNoBookingsIcon className="h-4 w-4" />
                    {t('contract.generate')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Contract Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 justify-center">
                <Button
                  variant="default"
                  onClick={handleViewContract}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {t('contract.view')}
                </Button>
                {/* <Button
                  onClick={handleDownloadContract}
                  disabled={downloading}
                  className="flex items-center gap-2"
                >
                  {downloading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      {t('contract.downloading')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {t('contract.download')}
                    </>
                  )}
                </Button> */}
              </div>
            </CardContent>
          </Card>

          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contract.contractInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('contract.contractNumber')}:</span>
                  <span className="text-sm font-medium">{contractNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('contract.status')}:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {t('contract.generated')}
                  </Badge>
                </div>
                {dbaReport && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('contract.dbaCompliance')}:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {t('contract.included')}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('contract.generatedOn')}:</span>
                  <span className="text-sm">{formatDate(new Date().toISOString())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regenerate Button */}
          {/* <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {t('contract.updateDescription')}
                </p>
                <Button 
                  onClick={handleGenerateContract} 
                  disabled={contractLoading} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {contractLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      {t('contract.regenerating')}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      {t('contract.regenerate')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card> */}
        </>
      )}

      {/* Contract PDF Modal */}
      <Dialog open={showContract} onOpenChange={setShowContract}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('contract.title')} PDF</DialogTitle>
            <DialogDescription>
              {t('contract.description')}
            </DialogDescription>
          </DialogHeader>
          {contractNumber && (
            <ContractPDFViewer
              booking={booking}
              dbaReport={dbaReport || undefined}
              contractNumber={contractNumber}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 