export const API_URL = 'http://16.59.101.33:8000';

export function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
