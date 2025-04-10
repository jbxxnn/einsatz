import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message)
  },
  error: (message: string) => {
    sonnerToast.error(message)
  },
  info: (message: string) => {
    sonnerToast.info(message)
  },
  warning: (message: string) => {
    sonnerToast.warning(message)
  },
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return sonnerToast.promise(promise, options)
  }
} 