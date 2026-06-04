import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export function useInventory() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/inventory`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { inventoryData: data, loading };
}

export function useTasksActive() {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`${API_BASE}/tasks/active`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return { activeTasks: data };
}

export function useTasksHistory() {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`${API_BASE}/tasks/history`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return { taskHistory: data };
}

export function useDashboardSummary() {
  const [data, setData] = useState<any>({
    throughputData: [],
    inventoryDistribution: [],
    systemHealth: [],
    dailySummary: {}
  });

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/summary`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return data;
}
