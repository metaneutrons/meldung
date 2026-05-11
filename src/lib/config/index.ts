import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { AppConfigSchema, type AppConfig } from './schema';

let cachedConfig: AppConfig | null = null;

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
  const parsed = parseYaml(raw) as unknown;
  const result = AppConfigSchema.safeParse(parsed);

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
