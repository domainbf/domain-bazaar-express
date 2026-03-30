import { getAccessToken } from './apiClient';

export interface RealtimeEvent {
  type: 'db-change' | 'connected';
  table?: string;
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  userId?: string;
}

type EventHandler = (event: RealtimeEvent) => void;

export interface Subscription {
  tables: string[];
  handler: EventHandler;
}

class RealtimeClient {
  private es: EventSource | null = null;
  private subs: Map<string, Subscription> = new Map();
  private retryDelay = 1000;
  private maxRetry = 30000;
  private stopped = false;

  subscribe(id: string, tables: string[], handler: EventHandler): () => void {
    this.subs.set(id, { tables, handler });
    this.ensureConnected();
    return () => this.unsubscribe(id);
  }

  unsubscribe(id: string) {
    this.subs.delete(id);
    if (this.subs.size === 0) {
      this.disconnect();
    }
  }

  private buildUrl(): string {
    const token = getAccessToken();
    const tables = [...new Set([...this.subs.values()].flatMap(s => s.tables))];
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (tables.length) params.set('tables', tables.join(','));
    return `/api/realtime/stream?${params.toString()}`;
  }

  private ensureConnected() {
    if (this.es && this.es.readyState !== EventSource.CLOSED) return;
    this.connect();
  }

  private connect() {
    if (this.stopped) return;
    try {
      this.es = new EventSource(this.buildUrl());

      this.es.onmessage = (e) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          this.dispatch(event);
        } catch { /* ignore parse errors */ }
      };

      this.es.onopen = () => {
        this.retryDelay = 1000;
      };

      this.es.onerror = () => {
        this.es?.close();
        this.es = null;
        if (!this.stopped && this.subs.size > 0) {
          setTimeout(() => this.connect(), this.retryDelay);
          this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetry);
        }
      };
    } catch {
      if (!this.stopped) {
        setTimeout(() => this.connect(), this.retryDelay);
      }
    }
  }

  private dispatch(event: RealtimeEvent) {
    for (const sub of this.subs.values()) {
      if (event.type === 'connected') {
        sub.handler(event);
        continue;
      }
      if (!event.table || sub.tables.length === 0 || sub.tables.includes(event.table)) {
        sub.handler(event);
      }
    }
  }

  disconnect() {
    this.es?.close();
    this.es = null;
  }

  reconnect() {
    this.disconnect();
    if (this.subs.size > 0) this.connect();
  }

  stop() {
    this.stopped = true;
    this.disconnect();
    this.subs.clear();
  }

  resume() {
    this.stopped = false;
    if (this.subs.size > 0) this.connect();
  }
}

export const realtimeClient = new RealtimeClient();
