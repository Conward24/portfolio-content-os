import { Redis } from '@upstash/redis';

// Single source of truth for the app's Redis connection.
//
// The live Upstash store (cerise-ocean / grown-monitor host) was attached in
// Vercel under a `NewRedis_` prefix, because the plain `KV_REST_API_*` names
// were already occupied by an older, deleted database. So the prefixed vars
// must take priority; the plain names are kept as a fallback for when the env
// is eventually consolidated, and UPSTASH_* covers a native Upstash integration.
export const redis = new Redis({
  url:
    process.env.NewRedis_KV_REST_API_URL ||
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL,
  token:
    process.env.NewRedis_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN,
});
