import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE, isApiReachable, markApiOffline, isFetchNetworkError } from './api';

/** POST a new task to the backend */
export async function createTask(payload: {
  type: string;
  description?: string;
  product?: string;
  quantity?: number;
  source?: string;
}) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/** Generic polling hook — fetches `url` every `intervalMs` and returns data */
function usePolling<T>(url: string, initialValue: T, intervalMs = 3000) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!(await isApiReachable())) {
      if (mountedRef.current) setLoading(false);
      return;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
        setLoading(false);
      }
    } catch (err) {
      if (isFetchNetworkError(err)) markApiOffline();
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData(); // initial fetch immediately
    const id = setInterval(fetchData, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchData, intervalMs]);

  return { data, loading };
}

export function useInventory() {
  const { data, loading } = usePolling<any[]>(`${API_BASE}/inventory`, [], 3000);
  return { inventoryData: data, loading };
}

export function useTasksActive() {
  const { data } = usePolling<any[]>(`${API_BASE}/tasks/active`, [], 2000);
  return { activeTasks: data };
}

export function useTasksHistory() {
  const { data } = usePolling<any[]>(`${API_BASE}/tasks/history`, [], 4000);
  return { taskHistory: data };
}

export function useDashboardSummary() {
  const { data } = usePolling<any>(
    `${API_BASE}/dashboard/summary`,
    {
      throughputData: [],
      inventoryDistribution: [],
      systemHealth: [],
      dailySummary: {},
    },
    3000
  );
  return data;
}
