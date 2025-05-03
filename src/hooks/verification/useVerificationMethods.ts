
import { useIsMobile } from "@/hooks/use-mobile";
import { VerificationMethod } from "./types";

/**
 * 获取可用的域名验证方法
 */
export const useVerificationMethods = () => {
  const isMobile = useIsMobile();
  
  const getVerificationMethods = (): VerificationMethod[] => {
    return [
      {
        id: 'dns',
        name: 'DNS验证',
        description: '通过添加TXT记录验证域名所有权',
        icon: 'Shield',
        recommended: !isMobile
      },
      {
        id: 'file',
        name: '文件验证',
        description: '通过上传验证文件到网站根目录验证所有权',
        icon: 'File',
        recommended: !isMobile
      },
      {
        id: 'html',
        name: 'HTML验证',
        description: '通过在网页中添加meta标签验证所有权',
        icon: 'Code',
        recommended: isMobile
      }
    ];
  };

  return { getVerificationMethods };
};
