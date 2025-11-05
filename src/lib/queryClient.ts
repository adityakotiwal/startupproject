import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes - data is considered fresh during this time
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Don't refetch on window focus - prevents site freeze when switching tabs
      // Data is still fresh for 5 min (staleTime), manual refresh available
      refetchOnWindowFocus: false,
      // Refetch on reconnect only
      refetchOnReconnect: true,
      // Refetch on mount only if data is stale (older than 5 min)
      // This ensures fresh data on navigation without constant refetching
      refetchOnMount: 'always',
    },
  },
})
