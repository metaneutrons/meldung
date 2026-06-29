import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { AppConfigSchema, type AppConfig } from './schema';

let cachedConfig: AppConfig | null = null;

/** Sets a nested value, creating intermediate objects as needed. */
function setNested(obj: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (typeof cur[key] !== 'object' || cur[key] === null) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[path[path.length - 1]!] = value;
}

/**
 * Environment overrides for deploy-specific and SECRET values, so credentials
 * need never live in the (version-controlled) YAML. Env always wins over YAML.
 */
const ENV_OVERRIDES: {
  env: string;
  path: readonly string[];
  transform?: (v: string) => unknown;
}[] = [
  { env: 'EMAIL_ENABLED', path: ['delivery', 'email', 'enabled'], transform: (v) => v === 'true' },
  { env: 'SMTP_HOST', path: ['delivery', 'email', 'smtp', 'host'] },
  { env: 'SMTP_PORT', path: ['delivery', 'email', 'smtp', 'port'], transform: Number },
  {
    env: 'SMTP_SECURE',
    path: ['delivery', 'email', 'smtp', 'secure'],
    transform: (v) => v === 'true',
  },
  { env: 'SMTP_USER', path: ['delivery', 'email', 'smtp', 'user'] },
  { env: 'SMTP_PASS', path: ['delivery', 'email', 'smtp', 'pass'] },
  { env: 'SMTP_FROM', path: ['delivery', 'email', 'smtp', 'from'] },
  {
    env: 'SMTP_RECIPIENTS',
    path: ['delivery', 'email', 'smtp', 'recipients'],
    transform: (v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
  },
  { env: 'ZNUNY_ENABLED', path: ['delivery', 'znuny', 'enabled'], transform: (v) => v === 'true' },
  { env: 'ZNUNY_BASE_URL', path: ['delivery', 'znuny', 'config', 'baseUrl'] },
  { env: 'ZNUNY_USERNAME', path: ['delivery', 'znuny', 'config', 'username'] },
  { env: 'ZNUNY_PASSWORD', path: ['delivery', 'znuny', 'config', 'password'] },
  { env: 'AUTH_ENABLED', path: ['auth', 'enabled'], transform: (v) => v === 'true' },
  { env: 'AUTH_ISSUER', path: ['auth', 'issuer'] },
  { env: 'AUTH_CLIENT_ID', path: ['auth', 'clientId'] },
  { env: 'AUTH_CLIENT_SECRET', path: ['auth', 'clientSecret'] },
  { env: 'PERSISTENCE_ENABLED', path: ['persistence', 'enabled'], transform: (v) => v === 'true' },
  { env: 'PERSISTENCE_DRIVER', path: ['persistence', 'driver'] },
  { env: 'DATABASE_URL', path: ['persistence', 'connectionString'] },
];

function applyEnvOverrides(parsed: Record<string, unknown>): Record<string, unknown> {
  for (const { env, path, transform } of ENV_OVERRIDES) {
    const raw = process.env[env];
    if (raw === undefined || raw === '') continue;
    setNested(parsed, path, transform ? transform(raw) : raw);
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = resolve(process.cwd(), 'meldung.config.yaml');

  if (!existsSync(configPath)) {
    throw new Error(
      `Configuration file not found: ${configPath}\n` +
        'Create a meldung.config.yaml in the project root. See meldung.config.example.yaml for reference.',
    );
  }

  const raw = readFileSync(configPath, 'utf-8');
  const parsed = (parseYaml(raw) ?? {}) as Record<string, unknown>;
  const merged = applyEnvOverrides(parsed);
  const result = AppConfigSchema.safeParse(merged);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid configuration in meldung.config.yaml:\n${issues}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig(): AppConfig {
  return loadConfig();
}
