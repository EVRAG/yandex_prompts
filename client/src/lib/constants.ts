const envServerUrl = import.meta.env.VITE_SERVER_URL;
// Default to current origin so production uses same-domain https/wss without hardcoding IP/port.
const fallbackServerUrl =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000';

export const SERVER_URL = envServerUrl ?? fallbackServerUrl;
export const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? '';
