import axios from 'axios';

/**
 * Hardened API Service — CivicGuide AI
 * Uses HttpOnly Cookies for sessions and X-Requested-With for CSRF protection.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  withCredentials: true, // CRITICAL: Allows browser to send HttpOnly cookies
  headers: { 
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Standard CSRF Protection Header
  },
});

// ── Interceptors ──────────────────────────────────────────

// Request Interceptor: Still attaches Bearer token if present (for mobile/API compatibility)
// and ensures CSRF header is present on every request.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicguide_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Set CSRF header explicitly for state-changing requests
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
    config.headers['X-CSRF-Token'] = Math.random().toString(36).substring(2);
  }
  
  return config;
});

// Response Interceptor: Handle auth failures gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized usually means the HttpOnly cookie has expired or is invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('civicguide_token');
      localStorage.removeItem('civicguide_user');
      
      // Only redirect if we're not already on the auth page
      if (!window.location.pathname.startsWith('/auth') && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    }
    
    // Log security-related errors for monitoring (obfuscate details)
    if (error.response?.status === 403) {
      console.warn('Security Access Denied (403)');
    }
    
    return Promise.reject(error);
  }
);

// ── Auth APIs ─────────────────────────────────────────────
export const authLogin = (idToken) => API.post('/auth/login', { idToken });
export const authLogout = () => API.post('/auth/logout');
export const authGetMe = () => API.get('/auth/me');
export const authUpdateProfile = (data) => API.post('/auth/profile', data);
export const authUploadAvatar = (image, mimeType) => API.post('/auth/avatar', { image, mimeType });

// ── Civic APIs ────────────────────────────────────────────
export const getJourney = () => API.get('/civic/journey');
export const getReadiness = () => API.get('/civic/readiness');
export const getQuiz = () => API.get('/civic/quiz');
export const getTimeline = () => API.get('/civic/timeline');

export const getScenarios = () => API.get('/civic/scenarios');
export const simulateScenario = (type) => API.get(`/civic/scenario/${type}`);

export const getChecklist = () => API.get('/civic/checklist');
export const updateChecklist = (items) => API.post('/civic/checklist/update', { items });

export const getQuizResults = () => API.get('/civic/quiz/results');
export const saveQuizResult = (data) => API.post('/civic/quiz/results', data);

export const sendChatMessage = (message, sessionId) => API.post('/chat', { message, sessionId });
export const getChatHistory = (sessionId) => API.get(`/chat/history/${sessionId}`);

export const getBoothGuide = (pincode, location) => API.post('/civic/booth', { pincode, location });

export const translateText = (text, targetLanguage) => API.post('/civic/translate', { text, targetLanguage });
export const synthesizeSpeech = (text, languageCode) => API.post('/civic/speech/synthesize', { text, languageCode }, { responseType: 'arraybuffer' });
export const recognizeSpeech = (audio, languageCode) => API.post('/civic/speech/recognize', { audio, languageCode });

export const getGlobalStats = () => API.get('/civic/analytics/stats');
export const getHealth = () => API.get('/system/health');

export default API;
