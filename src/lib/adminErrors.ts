/**
 * 后台保存的统一成功/失败提示与错误归类
 */
import { toast } from 'sonner';

export type AdminErrorKind = 'permission' | 'network' | 'validation' | 'conflict' | 'unknown';

export interface ClassifiedError {
  kind: AdminErrorKind;
  title: string;
  reason: string;
  suggestion: string;
}

export function classifyAdminError(err: unknown): ClassifiedError {
  const raw = (err as any)?.message ? String((err as any).message) : String(err ?? '');
  const lower = raw.toLowerCase();

  if (lower.includes('row-level security') || lower.includes('permission denied') ||
      lower.includes('not authorized') || lower.includes('403') || lower.includes('401')) {
    return {
      kind: 'permission',
      title: '保存失败：权限不足',
      reason: raw || '数据库行级安全策略拒绝了本次写入。',
      suggestion: '请确认当前账号已具备管理员权限（admin_roles），或重新登录后再试。',
    };
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') ||
      lower.includes('timeout') || lower.includes('超时') || lower.includes('502') || lower.includes('503')) {
    return {
      kind: 'network',
      title: '保存失败：网络异常',
      reason: raw || '无法连接到后端服务。',
      suggestion: '请检查网络连接后重试；系统已自动重试多次仍未成功。',
    };
  }
  if (lower.includes('duplicate') || lower.includes('conflict') || lower.includes('409')) {
    return {
      kind: 'conflict',
      title: '保存失败：数据冲突',
      reason: raw,
      suggestion: '该记录可能已被其他人修改，请刷新页面后重新保存。',
    };
  }
  if (lower.includes('invalid') || lower.includes('violates') || lower.includes('缺少') || lower.includes('400')) {
    return {
      kind: 'validation',
      title: '保存失败：数据不合法',
      reason: raw,
      suggestion: '请检查填写的字段格式与取值范围后重试。',
    };
  }
  return {
    kind: 'unknown',
    title: '保存失败',
    reason: raw || '未知错误',
    suggestion: '请稍后重试，若持续失败请查看「后端诊断」面板中的最近请求记录。',
  };
}

export function toastSaveSuccess(message = '保存成功', description?: string) {
  toast.success(message, description ? { description } : undefined);
}

export function toastSaveError(err: unknown): ClassifiedError {
  const info = classifyAdminError(err);
  toast.error(info.title, { description: `${info.reason}\n${info.suggestion}` });
  return info;
}
