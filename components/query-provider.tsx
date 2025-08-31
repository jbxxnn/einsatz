'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      const client = new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes (increased from 2)
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Keep data in cache for 10 minutes (increased from 5)
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Retry failed requests 3 times
            retry: 3,
            // Refetch every 10 minutes in background (increased from 2)
            refetchInterval: 10 * 60 * 1000, // 10 minutes
            // Ensure queries run on mount
            enabled: true,
          },
        },
      })
      
      // Log the settings to verify they're applied
      console.log('🔧 QueryClient created with settings:', {
        staleTime: '5 minutes',
        gcTime: '10 minutes', 
        refetchInterval: '10 minutes'
      })
      
      return client
    }
  )

  // Force clear cache and reset when component mounts
  useEffect(() => {
    console.log('🔄 QueryProvider mounted - clearing cache and resetting...')
    queryClient.clear()
    queryClient.resetQueries()
    
    // Test query to verify settings
    queryClient.setQueryData(['test'], { timestamp: Date.now(), settings: '10min' })
    
    // Add global query event listeners for debugging
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'added') {
        console.log('➕ Query added:', event.query.queryKey, 'at', new Date().toLocaleTimeString())
      } else if (event.type === 'updated') {
        console.log('🔄 Query updated:', event.query.queryKey, 'at', new Date().toLocaleTimeString())
      } else if (event.type === 'removed') {
        console.log('➖ Query removed:', event.query.queryKey, 'at', new Date().toLocaleTimeString())
      }
    })
    
    // Add mutation event listeners
    const mutationUnsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'added') {
        console.log('🧬 Mutation added:', event.mutation.options.mutationKey, 'at', new Date().toLocaleTimeString())
      }
    })
    
    return () => {
      unsubscribe()
      mutationUnsubscribe()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 