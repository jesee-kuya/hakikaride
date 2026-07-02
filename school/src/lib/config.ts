// Point this at the backend described in the School System backend guide.
// Set VITE_API_BASE_URL in a .env.local file to override for your environment,
// e.g. VITE_API_BASE_URL=http://192.168.1.20:8080
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
