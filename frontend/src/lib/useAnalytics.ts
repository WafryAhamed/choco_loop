import { useState, useEffect } from 'react';
import { apiFetch, API_BASE, getAuthHeaders } from './api';

export interface AnalyticsSummary {
  tasksCompleted: number;
  itemsSorted: number;
  topProduct: string;
  peakHour: string;
  successRate: number;
  failureRate: number;
  totalTasks: number;
}

export interface AnalyticsCharts {
  throughputData: Array<{ time: string; value: number }>;
  tasksByType: Array<{ name: string; value: number }>;
  inventoryDistribution: Array<{ name: string; value: number }>;
}

export interface AnalyticsData {
  success: boolean;
  range: string;
  dateRange: { start: string; end: string };
  summary: AnalyticsSummary;
  charts: AnalyticsCharts;
  insights: string[];
}

export function useAnalytics(range: string = 'today') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(
          `${API_BASE}/analytics?range=${encodeURIComponent(range)}`,
          {
            method: 'GET',
            headers: getAuthHeaders(),
          }
        );

        if (!response) {
          setError('Failed to connect to analytics service');
          setData(null);
          return;
        }

        if (!response.ok) {
          setError('Failed to load analytics data');
          setData(null);
          return;
        }

        const json = await response.json();
        if (json.success) {
          setData(json);
          setError(null);
        } else {
          setError(json.error || 'Unknown error');
          setData(null);
        }
      } catch (err) {
        console.error('[Analytics] Fetch error:', err);
        setError('Error loading analytics');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [range]);

  return { data, loading, error };
}
