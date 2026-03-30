import { useEffect, useCallback } from 'react';
import { realtimeClient, RealtimeEvent } from '@/lib/realtime';

let idCounter = 0;

export function useRealtimeSubscription(
  tables: string[],
  handler: (event: RealtimeEvent) => void,
  enabled = true
) {
  const stableHandler = useCallback(handler, []);

  useEffect(() => {
    if (!enabled || tables.length === 0) return;
    const id = `sub-${++idCounter}`;
    const unsub = realtimeClient.subscribe(id, tables, stableHandler);
    return unsub;
  }, [tables.join(','), enabled]);
}
