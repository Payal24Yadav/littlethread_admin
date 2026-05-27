import { useEffect, useState } from 'react';
import { getAdminProfile, logoutAdmin } from '../services/adminAuth';

export const useAdminAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      try {
        const data = await getAdminProfile();
        if (!isMounted) return;

        if (data?.profile?.role === 'admin') {
          setIsAdmin(true);
          setEmail(data.profile.email);
        } else {
          setIsAdmin(false);
          setEmail(null);
        }
      } catch (error) {
        if (!isMounted) return;
        logoutAdmin();
        setIsAdmin(false);
        setEmail(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    check();

    // Listen for manual logout events or token changes if needed
    const handleStorage = () => {
      if (!localStorage.getItem('adminToken')) {
        setIsAdmin(false);
        setEmail(null);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return { loading, isAdmin, email };
};
