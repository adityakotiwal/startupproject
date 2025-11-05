import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus ONLY if data is stale
      refetchOnWindowFocus: 'always',
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Use cached data on mount if available (don't force refetch)
      refetchOnMount: false,
    },
  },
})
