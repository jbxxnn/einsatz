"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X, Search, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
  user_type: string
}

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
  const { t } = useTranslation()
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchProfiles()
    }
  }, [isOpen, user])

  useEffect(() => {
    console.log('Search query changed:', searchQuery)
    console.log('Available profiles:', profiles.length)
    console.log('Current user ID:', user?.id)
    
    if (searchQuery.trim()) {
      const filtered = profiles.filter(profile => 
        profile.id !== user?.id && // Don't show current user
        (profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         profile.user_type?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      console.log('Filtered profiles:', filtered.length)
      setFilteredProfiles(filtered)
    } else {
      // Show all profiles (excluding current user) when no search query
      const allProfiles = profiles.filter(profile => profile.id !== user?.id)
      console.log('Showing all profiles:', allProfiles.length)
      setFilteredProfiles(allProfiles)
    }
  }, [searchQuery, profiles, user])

  const fetchProfiles = async () => {
    try {
      setIsSearching(true)
      console.log('Fetching profiles for user:', user?.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, user_type')
        .neq('id', user?.id) // Exclude current user
        .order('first_name')

      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      console.log('Profiles fetched:', data?.length || 0, 'profiles')
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartConversation = async () => {
    if (!selectedProfile || !user) return

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedProfile.id,
          message: message.trim() || undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const { conversationId } = await response.json()
      
      // Close modal and navigate to the conversation
      onClose()
      router.push(`/messages?conversation=${conversationId}`)
      
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile)
    setSearchQuery(`${profile.first_name} ${profile.last_name}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('newMessage')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t('searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Profile List */}
        <div className="flex-1 overflow-y-auto max-h-64">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('searching')}...
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="p-2">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedProfile?.id === profile.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => handleProfileSelect(profile)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium truncate">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {profile.user_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('noUsersFound')}
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('searchForUsers')}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {t('searchForUsers')}
            </div>
          )}
        </div>

        {/* Message Input (if profile selected) */}
        {selectedProfile && (
          <div className="p-4 border-t">
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-1">
                {t('messageTo')}: <span className="font-medium">{selectedProfile.first_name} {selectedProfile.last_name}</span>
              </p>
            </div>
            <Textarea
              placeholder={t('typeMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mb-3"
              rows={3}
            />
                          <Button 
                onClick={handleStartConversation} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? t('starting') : t('startConversationButton')}
              </Button>
          </div>
        )}
      </div>
    </div>
  )
}
