import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authGetMe, getChecklist, getHealth } from '../services/api';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be inside UserProvider');
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState({ mistral: { status: 'down' }, gemini: { status: 'down' } });

  // 1. Initial Load
  const init = useCallback(async () => {
    const token = localStorage.getItem('civicguide_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [uRes, cRes, jRes] = await Promise.all([
        authGetMe(), 
        getChecklist(),
        getJourney()
      ]);
      if (uRes.data.success) {
        setUser(uRes.data.data);
        if (cRes.data.success) setChecklist(cRes.data.data);
        if (jRes.data.success) setJourney(jRes.data.data);
      } else {
        logoutUser();
      }
    } catch (err) {
      console.error('Init Error:', err);
      logoutUser();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  // 2. Health Polling (Less aggressive)
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await getHealth();
        if (data.success) setAiStatus(data.ai);
      } catch (e) {}
    };
    const timer = setInterval(check, 300000); // 5 mins
    return () => clearInterval(timer);
  }, []);

  const loginUser = useCallback((userData, token, checklistData) => {
    localStorage.setItem('civicguide_token', token);
    setUser(userData);
    if (checklistData) setChecklist(checklistData);
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('civicguide_token');
    setUser(null);
    setChecklist(null);
    setJourney(null);
  }, []);

  const value = useMemo(() => ({
    user, setUser, 
    checklist, setChecklist, 
    journey, setJourney,
    loading, setLoading,
    aiStatus,
    loginUser, logoutUser,
    refreshData: init
  }), [user, checklist, journey, loading, aiStatus, loginUser, logoutUser, init]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
