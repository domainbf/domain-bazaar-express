
import { VerificationMethod } from './types';

/**
 * 提供域名验证方法配置的钩子
 */
export const useVerificationMethods = () => {
  const getVerificationMethods = (): VerificationMethod[] => {
    return [
      {
        id: 'dns',
        name: 'DNS验证',
        description: '通过添加DNS记录验证域名所有权',
        icon: 'shield',
        recommended: true
      },
      {
        id: 'file',
        name: '文件验证',
        description: '通过上传验证文件验证域名所有权',
        icon: 'file',
        recommended: false
      },
      {
        id: 'html',
        name: 'HTML验证',
        description: '通过添加META标签验证域名所有权',
        icon: 'code',
        recommended: false
      },
      {
        id: 'whois',
        name: 'WHOIS验证',
        description: '通过修改WHOIS信息验证域名所有权',
        icon: 'database',
        recommended: false
      }
    ];
  };
  
  return { getVerificationMethods };
};
