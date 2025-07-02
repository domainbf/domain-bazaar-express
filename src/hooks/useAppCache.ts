
import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
}

export function useAppCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = config; // Default 5 minutes TTL
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get cache from localStorage
  const getCache = useCallback((): CacheItem<T> | null => {
    try {
      const cached = localStorage.getItem(`app_cache_${key}`);
      if (cached) {
        const item: CacheItem<T> = JSON.parse(cached);
        if (Date.now() < item.expiry) {
          return item;
        } else {
          localStorage.removeItem(`app_cache_${key}`);
        }
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
    return null;
  }, [key]);

  // Set cache to localStorage
  const setCache = useCallback((data: T) => {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      };
      localStorage.setItem(`app_cache_${key}`, JSON.stringify(item));
    } catch (err) {
      console.error('Cache write error:', err);
    }
  }, [key, ttl]);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(`app_cache_${key}`);
  }, [key]);

  // Fetch data with caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCache();
      if (cached) {
        setData(cached.data);
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
      setCache(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetcher, getCache, setCache]);

  // Load cached data on mount
  useEffect(() => {
    const cached = getCache();
    if (cached) {
      setData(cached.data);
    } else {
      fetchData();
    }
  }, [getCache, fetchData]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchData(true),
    clearCache
  };
}
