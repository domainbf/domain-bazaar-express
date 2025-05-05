
import { VerificationMethod } from "./types";
import { Shield, File, Code, Database, Mail } from 'lucide-react';

/**
 * 提供验证方法列表的钩子
 */
export const useVerificationMethods = () => {
  /**
   * 获取可用的域名验证方法
   */
  const getVerificationMethods = (): VerificationMethod[] => {
    return [
      {
        id: 'dns',
        name: 'DNS验证',
        description: '通过添加TXT记录验证域名所有权',
        icon: 'Shield',
        recommended: true
      },
      {
        id: 'file',
        name: '文件验证',
        description: '通过上传文件到Web服务器验证域名所有权',
        icon: 'File',
        recommended: false
      },
      {
        id: 'html',
        name: 'HTML标签验证',
        description: '通过在网站中添加Meta标签验证域名所有权',
        icon: 'Code',
        recommended: false
      },
      {
        id: 'whois',
        name: 'WHOIS验证',
        description: '通过WHOIS信息验证域名所有权',
        icon: 'Database',
        recommended: false
      },
      {
        id: 'email',
        name: '邮箱验证',
        description: '通过域名管理员邮箱验证域名所有权',
        icon: 'Mail',
        recommended: false
      }
    ];
  };

  /**
   * 根据ID获取验证方法
   */
  const getVerificationMethodById = (id: string): VerificationMethod | undefined => {
    return getVerificationMethods().find(method => method.id === id);
  };

  /**
   * 根据验证方法获取图标组件
   */
  const getMethodIcon = (methodId: string) => {
    switch(methodId) {
      case 'dns': return Shield;
      case 'file': return File;
      case 'html': return Code;
      case 'whois': return Database;
      case 'email': return Mail;
      default: return Shield;
    }
  };

  return {
    getVerificationMethods,
    getVerificationMethodById,
    getMethodIcon
  };
};
