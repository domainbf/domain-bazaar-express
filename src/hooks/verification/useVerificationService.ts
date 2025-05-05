
import { useVerificationMethods } from './useVerificationMethods';
import { useVerificationProcess } from './useVerificationProcess';
import { VerificationServiceHook } from './types';

/**
 * 提供完整域名验证服务的钩子
 */
export const useVerificationService = (): VerificationServiceHook => {
  const { getVerificationMethods, getMethodIcon } = useVerificationMethods();
  const { startVerification, checkVerification, resendVerificationEmail } = useVerificationProcess();
  
  return {
    startVerification,
    checkVerification,
    getVerificationMethods,
    resendVerificationEmail,
    getMethodIcon
  };
};
