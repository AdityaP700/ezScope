import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let redis: IORedis.Redis | null = null;
const inMemoryStore: Record<string, any> = {};

if (REDIS_URL) {
  redis = new IORedis(REDIS_URL);
  console.log("Using Redis job queue");
} else {
  console.warn("REDIS_URL not set — using in-memory job queue (ephemeral)");
}

export async function createJob(job: any) {
  const id = `job:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  if (redis) {
    await redis.hset(id, { json: JSON.stringify(job) });
  } else {
    inMemoryStore[id] = job;
  }
  return id;
}

export async function getJob(id: string) {
  if (redis) {
    const data = await redis.hgetall(id);
    if (!data || !data.json) return null;
    try { return JSON.parse(data.json); } catch { return null; }
  }
  return inMemoryStore[id] || null;
}

export async function updateJob(id: string, patch: any) {
  const current = await getJob(id) || {};
  const updated = { ...current, ...patch };
  if (redis) {
    await redis.hset(id, { json: JSON.stringify(updated) });
  } else {
    inMemoryStore[id] = updated;
  }
  return updated;
}

export async function popNextJob() {
  // Redis queue logic omitted for now; placeholder for future worker processing
  return null;
}
