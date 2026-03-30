import { EventEmitter } from 'events';

export interface RealtimeEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  userId?: string;   // for user-scoped events
}

class EventBus extends EventEmitter {
  publish(event: RealtimeEvent) {
    this.emit('db-change', event);
    if (event.userId) {
      this.emit(`user:${event.userId}`, event);
    }
    this.emit(`table:${event.table}`, event);
  }
}

export const bus = new EventBus();
bus.setMaxListeners(200);
