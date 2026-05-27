import api from '../utils/api';

/**
 * Handles initial login step.
 * Returns { requires2FA: true, email: '...' } if 2FA is needed,
 * or { success: true, token: '...', email: '...' } if logged in directly.
 */
export async function loginAdmin(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  
  if (data.token) {
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminEmail', data.email);
  }
  
  return data;
}

/**
 * Verifies the 2FA OTP.
 */
export async function verifyAdminOtp(email, otp) {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  
  if (data.token) {
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminEmail', data.email);
  }
  
  return data;
}

/**
 * Placeholder for legacy forgot-password UI.
 * Admin auth currently relies on backend-managed credentials/flow,
 * so there is no public reset endpoint for admin accounts.
 */
export async function resetAdminPassword() {
  throw new Error('Admin password reset is not available in the current auth flow.');
}

/**
 * Logs out the admin.
 */
export async function logoutAdmin() {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminEmail');
  }
}

/**
 * Fetches the admin profile from our backend.
 */
export async function getAdminProfile() {
  try {
    const { data } = await api.get('/auth/profile');
    return data; // { profile: { id, email, role } }
  } catch (error) {
    // If unauthorized, clear local state
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminToken');
      return null;
    }
    console.error('Failed to fetch admin profile:', error);
    throw error;
  }
}
