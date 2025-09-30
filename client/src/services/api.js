import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Add retry logic for failed requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status >= 500 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// ATECO Hierarchy API
export const fetchATECOHierarchy = async (filters = {}) => {
  try {
    const response = await api.get('/ateco', { params: filters });
    return response.data.atecoCodes || response.data;
  } catch (error) {
    console.error('Error fetching ATECO hierarchy:', error);
    throw error;
  }
};

// ATECO Tree API
export const fetchATECOTree = async (rootCode = null) => {
  try {
    const url = rootCode ? `/ateco/tree/${rootCode}` : '/ateco/tree';
    const response = await api.get(url);
    return response.data.tree || response.data;
  } catch (error) {
    console.error('Error fetching ATECO tree:', error);
    throw error;
  }
};

// Companies API (now called imprese)
export const fetchCompanies = async (filters = {}) => {
  try {
    const response = await api.get('/imprese', { params: filters });
    return response.data.imprese || response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

// Statistics API (now under imprese)
export const fetchStatistics = async (filters = {}) => {
  try {
    const response = await api.get('/imprese/statistics', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

// Filter options API
export const fetchFilterOptions = async () => {
  try {
    const response = await api.get('/imprese/filter-options');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

// Map data API
export const fetchMapData = async (filters = {}) => {
  try {
    const response = await api.get('/imprese/map-data', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching map data:', error);
    throw error;
  }
};

// Geocoding API
export const geocodeAddress = async (address) => {
  try {
    const response = await api.post('/geocode', { address });
    return response.data;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

// Export API
export const exportData = async (format, filters = {}) => {
  try {
    const response = await api.post('/export', { format, filters }, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Regions API
export const fetchRegions = async () => {
  try {
    const response = await api.get('/regions');
    return response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
};

// Provinces API
export const fetchProvinces = async (regionCode = null) => {
  try {
    const response = await api.get('/provinces', {
      params: { region: regionCode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

// Municipalities API
export const fetchMunicipalities = async (provinceCode = null) => {
  try {
    const response = await api.get('/municipalities', {
      params: { province: provinceCode }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    throw error;
  }
};

export default api;
