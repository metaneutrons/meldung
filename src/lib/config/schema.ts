import { z } from 'zod';

const BrandingSchema = z.object({
  orgName: z.string(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().default('#38b449'),
  accentColor: z.string().default('#333333'),
});

const SmtpSchema = z.object({
  host: z.string(),
  port: z.number(),
  secure: z.boolean().default(true),
  user: z.string(),
  pass: z.string(),
  from: z.string(),
  recipients: z.array(z.string()),
});

const ZnunyMappingSchema = z.enum(['minimal', 'rich', 'json-attachment']);

const ZnunySchema = z.object({
  baseUrl: z.string().url(),
  username: z.string(),
  password: z.string(),
  queue: z.string().default('Security'),
  priority: z.string().default('3 normal'),
  state: z.string().default('new'),
  mappingMode: ZnunyMappingSchema.default('minimal'),
  fieldMappings: z.record(z.string(), z.string()).optional(),
});

const DeliverySchema = z.object({
  email: z.object({ enabled: z.boolean().default(false), smtp: SmtpSchema.optional() }),
  znuny: z.object({ enabled: z.boolean().default(false), config: ZnunySchema.optional() }),
});

const PersistenceSchema = z.object({
  enabled: z.boolean().default(false),
  driver: z.enum(['sqlite', 'postgres']).default('sqlite'),
  connectionString: z.string().optional(),
});

const AuthSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['saml', 'oidc']).default('oidc'),
  issuer: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

const TaxonomyEntrySchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const TaxonomyCategorySchema = z.object({
  value: z.string(),
  label: z.string(),
  entries: z.array(TaxonomyEntrySchema),
});

export const AppConfigSchema = z.object({
  branding: BrandingSchema,
  defaultLocale: z.enum(['de', 'en', 'es', 'fr', 'tr', 'it']).default('de'),
  delivery: DeliverySchema,
  persistence: PersistenceSchema.default({}),
  auth: AuthSchema.default({}),
  taxonomy: z.array(TaxonomyCategorySchema).optional(),
  systems: z.array(z.string()).optional(),
  dataCategories: z.array(z.string()).optional(),
  personCategories: z.array(z.string()).optional(),
  referencePrefix: z.string().default('INC'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type Branding = z.infer<typeof BrandingSchema>;
export type DeliveryConfig = z.infer<typeof DeliverySchema>;
export type ZnunyConfig = z.infer<typeof ZnunySchema>;
export type SmtpConfig = z.infer<typeof SmtpSchema>;
