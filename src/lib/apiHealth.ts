/**
 * 后端健康检查 + 管理请求诊断记录
 *
 * 后台管理原本调用 Express/Turso 接口（/api/data/...）。该服务在
 * Lovable / Vercel 环境不存在，因此启动时探测一次：不可用则切换到
 * Supabase 桥接，并在 UI 上提示"已切换后端"。
 */
import { toast } from 'sonner';

export type BackendMode = 'supabase' | 'express' | 'checking' | 'unknown';

export interface ApiRequestRecord {
  id: string;
  path: string;
  method: string;
  backend: 'supabase' | 'express';
  status: number;
  ok: boolean;
  attempts: number;
  durationMs: number;
  at: string;
  summary: string;
}

interface HealthState {
  mode: BackendMode;
  expressAvailable: boolean | null;
  lastCheckAt: string | null;
  checkError: string | null;
  records: ApiRequestRecord[];
}

const MAX_RECORDS = 25;

let state: HealthState = {
  mode: 'unknown',
  expressAvailable: null,
  lastCheckAt: null,
  checkError: null,
  records: [],
};

type Listener = (s: HealthState) => void;
const listeners = new Set<Listener>();

const emit = () => { listeners.forEach(l => l(state)); };

export function subscribeHealth(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => { listeners.delete(listener); };
}

export function getHealthState(): HealthState { return state; }

export function summarize(data: unknown, limit = 220): string {
  try {
    if (data === undefined || data === null) return '';
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return text.length > limit ? `${text.slice(0, limit)}…` : text;
  } catch {
    return '[unserializable]';
  }
}

export function recordApiRequest(rec: Omit<ApiRequestRecord, 'id' | 'at'>) {
  const full: ApiRequestRecord = {
    ...rec,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
  state = { ...state, records: [full, ...state.records].slice(0, MAX_RECORDS) };
  emit();
}

export function clearApiRecords() {
  state = { ...state, records: [] };
  emit();
}

let checkPromise: Promise<boolean> | null = null;

/**
 * 探测 /api/data 是否可用。不可用时切换到 Supabase 桥接并提示一次。
 */
export async function checkBackendHealth(baseUrl: string, opts: { notify?: boolean } = {}): Promise<boolean> {
  if (checkPromise) return checkPromise;
  state = { ...state, mode: 'checking' };
  emit();

  checkPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    let available = false;
    let error: string | null = null;
    try {
      const res = await fetch(`${baseUrl}/data/site-settings`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      available = res.ok;
      if (!res.ok) error = `HTTP ${res.status}`;
    } catch (e: any) {
      error = e?.name === 'AbortError' ? '请求超时' : (e?.message || '网络错误');
    } finally {
      clearTimeout(timer);
    }

    const previous = state.expressAvailable;
    state = {
      ...state,
      expressAvailable: available,
      mode: available ? 'express' : 'supabase',
      lastCheckAt: new Date().toISOString(),
      checkError: error,
    };
    emit();

    if (!available && opts.notify !== false && previous !== false) {
      toast.info('已切换后端：Supabase 直连', {
        description: `旧接口 /api/data 不可用（${error ?? '未知原因'}），管理读写将直接走 Supabase。`,
      });
    }
    return available;
  })().finally(() => { checkPromise = null; });

  return checkPromise;
}
