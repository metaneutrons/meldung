import { z } from 'zod';
import { routing } from '@/i18n/routing';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const hexColor = (msg: string) => z.string().regex(HEX, msg);

const BrandingSchema = z.object({
  orgName: z.string(),
  // Web logo (SVG or raster) in public/. Omit for text-only.
  logoUrl: z.string().optional(),
  // Optional dark-mode logo variant shown when the dark theme is active.
  logoDarkUrl: z.string().optional(),
  // Raster logo (PNG/JPG/WebP) for the PDF — @react-pdf cannot embed SVG.
  // Falls back to logoUrl when that is itself a raster image.
  logoPdfUrl: z.string().optional(),
  // Optional browser-tab icon.
  favicon: z.string().optional(),
  primaryColor: hexColor('branding.primaryColor must be a hex color, e.g. #38b449').default(
    '#38b449',
  ),
  // Optional text-on-brand color; auto-derived for contrast when omitted.
  brandForeground: hexColor('branding.brandForeground must be a hex color').optional(),
  accentColor: hexColor('branding.accentColor must be a hex color').default('#333333'),
  // Optional browser-tab + PDF title and meta description.
  appTitle: z.string().optional(),
  appDescription: z.string().optional(),
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
  defaultLocale: z.enum(routing.locales).default(routing.defaultLocale),
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
