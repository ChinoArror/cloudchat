// In a real app, these would be environment variables or stored securely in a DB.
// For this standalone demo, they are hardcoded as requested.
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Mylover10'
};

export const ADMIN_USER_ID = 'admin-001';

export const COOKIE_NAME = 'cloudchat_session';
export const COOKIE_EXPIRY_DAYS = 7;

// Simulated Encryption Key (In real app, manage via KMS or env)
export const ENCRYPTION_SECRET = 'r9zRkEgZDOmQkPlwSexj2SpaCTDcKZYwYc9XmIazrLgVsHT1VlXoLUAj7664BvyNTYOutRIfJ9nnleTNpEip3kdwF';

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