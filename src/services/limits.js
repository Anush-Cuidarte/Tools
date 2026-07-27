import { useState, useEffect } from 'react';
import { useAuth } from './auth';
import api from './api';

export function useLimits() {
  const { user } = useAuth();
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLimits(null);
      setLoading(false);
      return;
    }
    api
      .limites()
      .then(setLimits)
      .catch(() => setLimits(null))
      .finally(() => setLoading(false));
  }, [user]);

  const checkCanExecute = () => {
    if (!limits) return false;
    if (limits.has_active_subscription) return true;
    if (limits.demo?.is_demo_user && limits.demo.executions_remaining > 0) return true;
    return false;
  };

  const checkCanExport = () => {
    if (!limits) return false;
    if (limits.has_active_subscription) return true;
    if (limits.demo?.is_demo_user && limits.demo.exports_remaining > 0) return true;
    return false;
  };

  return { limits, loading, checkCanExecute, checkCanExport, refresh: () => api.limites().then(setLimits) };
}
