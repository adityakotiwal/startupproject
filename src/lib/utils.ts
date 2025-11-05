// Utility functions for handling loading states and timeouts

export const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000,
  timeoutMessage: string = 'Request timed out'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

export const handleSupabaseError = (error: any, defaultMessage: string = 'An error occurred') => {
  if (!error) return null
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }
  
  if (error.code === '42501') {
    return 'Permission denied. Please check your access rights.'
  }
  
  if (error.code === '23505') {
    return 'This record already exists.'
  }
  
  if (error.message?.includes('does not exist')) {
    return 'Database table not found. Please check your setup.'
  }
  
  return error.message || defaultMessage
}