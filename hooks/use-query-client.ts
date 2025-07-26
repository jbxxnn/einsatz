import { useQueryClient } from '@tanstack/react-query'

export function useQueryClientUtils() {
  const queryClient = useQueryClient()

  const invalidateFreelancers = () => {
    queryClient.invalidateQueries({ queryKey: ['freelancers'] })
  }

  const invalidateFreelancer = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['freelancers'] })
    queryClient.invalidateQueries({ queryKey: ['freelancer', id] })
  }

  return {
    queryClient,
    invalidateFreelancers,
    invalidateFreelancer,
  }
} 