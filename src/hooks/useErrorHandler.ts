
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  defaultMessage?: string;
}

export const useErrorHandler = () => {
  const { t } = useTranslation();

  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      defaultMessage = t('common.error', '发生了未知错误')
    } = options;

    const errorMessage = error instanceof Error ? error.message : defaultMessage;

    if (logError) {
      console.error('Error handled:', error);
    }

    if (showToast) {
      toast.error(errorMessage);
    }

    return errorMessage;
  }, [t]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};
