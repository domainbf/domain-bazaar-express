
import { useVerificationMethods } from './useVerificationMethods';
import { useVerificationProcess } from './useVerificationProcess';
import { VerificationServiceHook } from './types';
import { useTranslation } from 'react-i18next';

/**
 * 提供完整域名验证服务的钩子
 */
export const useVerificationService = (): VerificationServiceHook => {
  const { getVerificationMethods, getMethodIcon } = useVerificationMethods();
  const { 
    startVerification, 
    checkVerification, 
    resendVerificationEmail,
    getVerificationStatus 
  } = useVerificationProcess();
  const { t } = useTranslation();
  
  return {
    startVerification,
    checkVerification,
    getVerificationMethods: () => getVerificationMethods().map(method => ({
      ...method,
      name: t(`verification.methods.${method.id}`, method.name)
    })),
    resendVerificationEmail,
    getVerificationStatus,
    getMethodIcon
  };
};
