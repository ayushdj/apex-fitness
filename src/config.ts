export const API_URL = 'https://responsible-quietude-production-4896.up.railway.app';

export function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
