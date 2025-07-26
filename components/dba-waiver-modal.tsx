'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, AlertCircle, FileText } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useDBAWaiver } from '@/hooks/use-dba-waiver'
import { toast } from '@/hooks/use-toast'

interface DBAWaiverModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  onWaiverCreated?: () => void
}

export default function DBAWaiverModal({
  isOpen,
  onClose,
  bookingId,
  onWaiverCreated
}: DBAWaiverModalProps) {
  const { t } = useTranslation()
  const { createWaiver, loading } = useDBAWaiver()
  const [waiverReason, setWaiverReason] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isUnderstood, setIsUnderstood] = useState(false)

  const handleSubmit = async () => {
    if (!isConfirmed || !isUnderstood) {
      toast({
        title: t('dba.waiver.error.title'),
        description: t('dba.waiver.error.confirmationRequired'),
        variant: 'destructive'
      })
      return
    }

    try {
      await createWaiver({
        bookingId,
        waiverReason: waiverReason.trim() || undefined
      })

      toast({
        title: t('dba.waiver.success.title'),
        description: t('dba.waiver.success.description')
      })

      onWaiverCreated?.()
      handleClose()
    } catch (error: any) {
      toast({
        title: t('dba.waiver.error.title'),
        description: error.message || t('dba.waiver.error.description'),
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    setWaiverReason('')
    setIsConfirmed(false)
    setIsUnderstood(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>{t('dba.waiver.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('dba.waiver.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Legal Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-800">
                  {t('dba.waiver.legalWarning.title')}
                </h4>
                <div className="text-sm text-orange-700 space-y-2">
                  <p>{t('dba.waiver.legalWarning.paragraph1')}</p>
                  <p>{t('dba.waiver.legalWarning.paragraph2')}</p>
                  <p>{t('dba.waiver.legalWarning.paragraph3')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* What you're skipping */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">
                  {t('dba.waiver.whatYouSkip.title')}
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• {t('dba.waiver.whatYouSkip.item1')}</li>
                  <li>• {t('dba.waiver.whatYouSkip.item2')}</li>
                  <li>• {t('dba.waiver.whatYouSkip.item3')}</li>
                  <li>• {t('dba.waiver.whatYouSkip.item4')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reason for waiver */}
          <div className="space-y-3">
            <Label htmlFor="waiver-reason" className="text-sm font-medium">
              {t('dba.waiver.reason')} ({t('common.optional')})
            </Label>
            <Textarea
              id="waiver-reason"
              placeholder={t('dba.waiver.reasonPlaceholder')}
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {t('dba.waiver.reasonHelp')}
            </p>
          </div>

          {/* Confirmation checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="understood"
                checked={isUnderstood}
                onCheckedChange={(checked) => setIsUnderstood(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="understood" className="text-sm leading-relaxed">
                {t('dba.waiver.understood')}
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="confirmed"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="confirmed" className="text-sm leading-relaxed">
                {t('dba.waiver.confirm')}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isConfirmed || !isUnderstood}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('dba.waiver.processing')}
              </div>
            ) : (
              t('dba.waiver.skipDBA')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 