
import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

export function useAppCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
) {
  const { 
    ttl = 5 * 60 * 1000, // Default 5 minutes TTL
    maxSize = 100,
    staleWhileRevalidate = true 
  } = config;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const fetcherRef = useRef(fetcher);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Get cache from localStorage with error handling
  const getCache = useCallback((): CacheItem<T> | null => {
    try {
      const cached = localStorage.getItem(`app_cache_${key}`);
      if (cached) {
        const item: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();
        
        if (now < item.expiry) {
          return item;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(`app_cache_${key}`);
          // If staleWhileRevalidate is enabled, return expired data but mark as stale
          if (staleWhileRevalidate) {
            setIsStale(true);
            return item;
          }
        }
      }
    } catch (err) {
      console.error('Cache read error:', err);
      // Clear corrupted cache
      localStorage.removeItem(`app_cache_${key}`);
    }
    return null;
  }, [key, staleWhileRevalidate]);

  // Set cache to localStorage with error handling and size management
  const setCache = useCallback((data: T) => {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      };
      
      const cacheString = JSON.stringify(item);
      
      // Simple cache size management
      try {
        localStorage.setItem(`app_cache_${key}`, cacheString);
        setIsStale(false);
      } catch (quotaError) {
        // If quota exceeded, clear some old cache entries
        console.warn('Cache quota exceeded, clearing old entries');
        clearOldCacheEntries();
        // Try again
        localStorage.setItem(`app_cache_${key}`, cacheString);
        setIsStale(false);
      }
    } catch (err) {
      console.error('Cache write error:', err);
    }
  }, [key, ttl]);

  // Clear old cache entries to free up space
  const clearOldCacheEntries = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('app_cache_'));
      const cacheEntries = keys.map(k => {
        try {
          const item = JSON.parse(localStorage.getItem(k) || '{}');
          return { key: k, timestamp: item.timestamp || 0 };
        } catch {
          return { key: k, timestamp: 0 };
        }
      }).sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries if we have too many
      const entriesToRemove = Math.max(0, cacheEntries.length - maxSize + 10);
      cacheEntries.slice(0, entriesToRemove).forEach(entry => {
        localStorage.removeItem(entry.key);
      });
    } catch (err) {
      console.error('Error clearing old cache entries:', err);
    }
  }, [maxSize]);

  // Clear cache for this key
  const clearCache = useCallback(() => {
    localStorage.removeItem(`app_cache_${key}`);
    setIsStale(false);
  }, [key]);

  // Fetch data with caching and abort support
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cached = getCache();
      if (cached && !isStale) {
        setData(cached.data);
        return cached.data;
      }
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcherRef.current();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return data; // Return current data if aborted
      }
      
      setData(result);
      setCache(result);
      return result;
    } catch (err) {
      // Check if error is due to abort
      if (abortControllerRef.current?.signal.aborted) {
        return data; // Return current data if aborted
      }
      
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [getCache, setCache, isStale, data]);

  // Load cached data on mount
  useEffect(() => {
    const cached = getCache();
    if (cached) {
      setData(cached.data);
      // If data is stale, trigger a background refresh
      if (isStale && staleWhileRevalidate) {
        fetchData(true).catch(console.error);
      }
    } else {
      fetchData().catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key]); // Only depend on key to avoid infinite loops

  // Refresh function that forces a new fetch
  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    clearCache
  };
}
