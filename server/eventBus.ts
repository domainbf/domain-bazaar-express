import { EventEmitter } from 'events';
import { publishEvent, PUBSUB_CHANNEL, redisSub } from './redis.js';

export interface RealtimeEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  userId?: string;
}

// Local emitter — receives events forwarded from Redis subscriber
class EventBus extends EventEmitter {
  async publish(event: RealtimeEvent) {
    // Publish to Redis so ALL server instances receive it
    try {
      await publishEvent(event as Record<string, unknown>);
    } catch (err) {
      console.error('[eventBus] Redis publish error:', err);
      // Fallback: emit locally so SSE clients on this instance still get events
      this._emit(event);
    }
  }

  // Called by the Redis subscriber — broadcasts to local SSE handlers
  _emit(event: RealtimeEvent) {
    this.emit('db-change', event);
    if (event.userId) {
      this.emit(`user:${event.userId}`, event);
    }
    this.emit(`table:${event.table}`, event);
  }
}

export const bus = new EventBus();
bus.setMaxListeners(500);

// Subscribe to Redis channel and forward all events to local bus
export async function setupRedisBridge() {
  await redisSub.subscribe(PUBSUB_CHANNEL);
  redisSub.on('message', (_channel, message) => {
    try {
      const event = JSON.parse(message) as RealtimeEvent;
      bus._emit(event);
    } catch (err) {
      console.error('[eventBus] Failed to parse Redis message:', err);
    }
  });
  console.log('[eventBus] Redis pub/sub bridge active');
}
