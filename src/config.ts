export const API_URL = 'http://3.134.116.103:8000';

export function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
