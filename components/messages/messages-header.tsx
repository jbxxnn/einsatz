"use client"

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import NewMessageModal from './new-message-modal'

export default function MessagesHeader() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  const handleNewMessage = () => {
    setIsNewMessageModalOpen(true)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Conversations</h1>
        {/* <div>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div> */}
        {/* <Button onClick={handleNewMessage} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>{t('newMessage')}</span>
        </Button> */}
      </div>

      {/* <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </form> */}

      {/* New Message Modal */}
      <NewMessageModal 
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
      />
    </div>
  )
}
