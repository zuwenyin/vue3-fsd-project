export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  appTitle: import.meta.env.VITE_APP_TITLE ?? 'FSD Template',
}
