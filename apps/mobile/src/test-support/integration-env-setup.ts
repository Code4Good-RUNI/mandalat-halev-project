// Set the API base URL before any module imports so client.ts doesn't throw.
// The NestJS server must be running on this address (npx nx serve server).
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000/api';
