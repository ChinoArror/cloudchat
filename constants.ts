// In a real app, these would be environment variables or stored securely.
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Mylover10'
};

export const ADMIN_USER_ID = 'admin-001';

export const COOKIE_NAME = 'cloudchat_session';
export const COOKIE_EXPIRY_DAYS = 7;

// Client-side encryption key for message content privacy
export const ENCRYPTION_SECRET = 'r9zRkEgZDOmQkPlwSexj2SpaCTDcKZYwYc9XmIazrLgVsHT1VlXoLUAj7664BvyNTYOutRIfJ9nnleTNpEip3kdwF';

// --- FIREBASE CONFIGURATION ---
// We check LocalStorage for a saved config to allow runtime setup without rebuilding.
export const CONFIG_STORAGE_KEY = 'chat';

const getSavedConfig = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const savedConfig = getSavedConfig();

export const FIREBASE_CONFIG = savedConfig || {
  
    apiKey: "AIzaSyB9Pe6GBZiRmS3vWdwwj8-if4awb3klm4A",
    authDomain: "gen-lang-client-0993677211.firebaseapp.com",
    projectId: "gen-lang-client-0993677211",
    storageBucket: "gen-lang-client-0993677211.firebasestorage.app",
    messagingSenderId: "943522699033",
    appId: "1:943522699033:web:92abf3e49244e262fe5788"
  
};

export const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '👇', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🙏',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '✨', '🌟', '💫', '💥', '💢', '💦', '💧', '💤', '👋'
];