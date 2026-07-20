const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiClient {
  getVitals: () => Promise<any[]>;
  getVitalsByType: (type: string) => Promise<any[]>;
  createVital: (vital: any) => Promise<any>;
  updateVital: (id: string, vital: any) => Promise<any>;
  deleteVital: (id: string) => Promise<any>;
}

// API Client
const apiClient: ApiClient = {
  async getVitals() {
    try {
      const response = await fetch(`${API_BASE_URL}/vitals`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback');
      const saved = localStorage.getItem('wellnest_entries');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async getVitalsByType(type: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/vitals/${type}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback');
      const saved = localStorage.getItem('wellnest_entries');
      const entries = saved ? JSON.parse(saved) : [];
      return entries.filter((e: any) => e.type === type);
    }
  },

  async createVital(vital: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vital),
      });
      if (!response.ok) throw new Error('Failed to create');
      return await response.json();
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback');
      const saved = localStorage.getItem('wellnest_entries');
      const entries = saved ? JSON.parse(saved) : [];
      const newVital = { ...vital, id: crypto.randomUUID(), timestamp: Date.now() };
      entries.push(newVital);
      localStorage.setItem('wellnest_entries', JSON.stringify(entries));
      return newVital;
    }
  },

  async updateVital(id: string, vital: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/vitals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vital),
      });
      if (!response.ok) throw new Error('Failed to update');
      return await response.json();
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback');
      const saved = localStorage.getItem('wellnest_entries');
      const entries = saved ? JSON.parse(saved) : [];
      const index = entries.findIndex((e: any) => e.id === id);
      if (index !== -1) {
        entries[index] = { ...entries[index], ...vital };
        localStorage.setItem('wellnest_entries', JSON.stringify(entries));
        return entries[index];
      }
      throw error;
    }
  },

  async deleteVital(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/vitals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return await response.json();
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback');
      const saved = localStorage.getItem('wellnest_entries');
      const entries = saved ? JSON.parse(saved) : [];
      const filtered = entries.filter((e: any) => e.id !== id);
      localStorage.setItem('wellnest_entries', JSON.stringify(filtered));
      return { id };
    }
  },
};

export default apiClient;
