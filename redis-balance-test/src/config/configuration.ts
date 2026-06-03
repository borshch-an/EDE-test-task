export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  allInGame: {
    apiUrl: process.env.ALL_INGAME_API_URL || 'https://api.all-ingame.example.com',
    apiToken: process.env.ALL_INGAME_API_TOKEN || 'default-mock-token',
    cacheTtl: parseInt(process.env.GAMES_CACHE_TTL || '60000', 10), // milliseconds
  },
});
