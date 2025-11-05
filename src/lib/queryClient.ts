import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes; keep it on screen during refetch
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Don't refetch on window focus - we manage this manually in useFocusRehydration
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount - prevents zeros flicker and uses cache
      // Was 'always' which caused data to briefly clear on every mount
      refetchOnMount: false,
      // ⭐ Keep previous data visible while refetching - NO MORE ZEROS!
      // @ts-ignore - placeholderData is the new name in v5, but keeping backward compat
      placeholderData: (previousData: any) => previousData,
    },
  },
})
