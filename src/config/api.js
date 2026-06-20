// Central API configuration.
//
// By default the app runs on mock data (so it works with no backend).
// To use the real Spring Boot backend, create a `.env` file with:
//   VITE_USE_MOCK=false
//   VITE_API_URL=http://localhost:8080/api/v1
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Mock is ON unless explicitly disabled.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const TOKEN_KEY = 'adapt_token';
export const REFRESH_KEY = 'adapt_refresh';
export const USER_KEY = 'adapt_user';
