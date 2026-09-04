import 'dotenv/config';

function getEnv(key: string, defaultValue?: string): string {
  const val = process.env[key] ?? defaultValue;
  if (!val) {
    throw new Error(`[Config Err] Missing environment variable: ${key}`);
  }
  return val;
}

export const config = {
  hoshimiKey: getEnv('HOSHIMI_KEY'),
  qotdKey: getEnv('QOTD_KEY'),
  port: Number(process.env.PORT ?? 2333),
} as const;
