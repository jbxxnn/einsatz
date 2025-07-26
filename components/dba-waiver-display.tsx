'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText, Calendar, Loader } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useDBAWaiver } from '@/hooks/use-dba-waiver'
import DBAWaiverModal from './dba-waiver-modal'
import type { Database } from '@/lib/database.types'

type DBAWaiver = Database['public']['Tables']['dba_waivers']['Row']

interface DBAWaiverDisplayProps {
  bookingId: string
  userType: 'client' | 'freelancer'
  onWaiverCreated?: () => void
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

export default function DBAWaiverDisplay({
  bookingId,
  userType,
  onWaiverCreated
}: DBAWaiverDisplayProps) {
  const { t } = useTranslation()
  const { getWaiverByBooking, loading } = useDBAWaiver()
  const [waiver, setWaiver] = useState<DBAWaiver | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadWaiver()
  }, [bookingId])

  const loadWaiver = async () => {
    const waiverData = await getWaiverByBooking(bookingId)
    setWaiver(waiverData)
  }

  const handleWaiverCreated = () => {
    loadWaiver()
    onWaiverCreated?.()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && !waiver) {
    return (
      <Card>
        <CardContent className="p-6">
        <div className="flex justify-center items-center w-full">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
        </CardContent>
      </Card>
    )
  }

  if (!waiver) {
    // Only show waiver option to clients
    if (userType !== 'client') {
      return null
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CustomNoBookingsIcon className="h-5 w-5 text-orange-500" />
            <CardTitle>{t('dba.waiver.option.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('dba.waiver.option.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                {t('dba.waiver.option.warning')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowModal(true)}
              className="w-full"
            >
              {t('dba.waiver.option.skipDBA')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show waiver information
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CustomNoBookingsIcon className="h-5 w-5 text-orange-500" />
          <CardTitle>{t('dba.waiver.status.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('dba.waiver.status.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Waiver Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {t('dba.waiver.status.waived')}
            </Badge>
          </div>

          {/* Waiver Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {t('dba.waiver.status.signedOn')}: {formatDate(waiver.created_at)}
              </span>
            </div>

            {waiver.waiver_reason && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {t('dba.waiver.status.reason')}:
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {waiver.waiver_reason}
                </p>
              </div>
            )}

            {/* Legal Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                {t('dba.waiver.status.legalNotice.title')}
              </h4>
              <p className="text-sm text-orange-700">
                {t('dba.waiver.status.legalNotice.description')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Waiver Modal */}
      <DBAWaiverModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        bookingId={bookingId}
        onWaiverCreated={handleWaiverCreated}
      />
    </Card>
  )
} 