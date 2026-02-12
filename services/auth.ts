import { User, Session, UserStatus } from '../types';
import { COOKIE_NAME, COOKIE_EXPIRY_DAYS } from '../constants';
import { findUserByUsername } from './storage';

export const setSessionCookie = (session: Session) => {
  const d = new Date();
  d.setTime(d.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  const value = btoa(JSON.stringify(session)); // Simple encoding for cookie value
  document.cookie = `${COOKIE_NAME}=${value};${expires};path=/;SameSite=Strict`;
};

export const getSessionFromCookie = (): Session | null => {
  const name = COOKIE_NAME + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      try {
        const jsonStr = atob(c.substring(name.length, c.length));
        const session = JSON.parse(jsonStr) as Session;
        return session;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const clearSessionCookie = () => {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Now returns a Promise
export const login = async (username: string, password: string): Promise<{ success: boolean, session?: Session, message?: string }> => {
  try {
    const user = await findUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    if (user.status === UserStatus.PAUSED) {
      return { success: false, message: 'This account has been suspended by an administrator.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid credentials' };
    }

    const session: Session = {
      userId: user.id,
      username: user.username,
      role: user.role,
      expiry: Date.now() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    
    setSessionCookie(session);
    return { success: true, session };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: 'Network error during login.' };
  }
};

export const logout = () => {
  clearSessionCookie();
  window.location.reload();
};