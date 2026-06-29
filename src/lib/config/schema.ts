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

// OTRS-compatible ticket connector. Znuny and OTOBO are both OTRS 6 forks that
// ship the identical GenericInterface REST connector (/Session → /Ticket), so a
// single schema and connector serve both — only the channel label differs.
const OtrsTicketSchema = z.object({
  baseUrl: z.string().url(),
  username: z.string(),
  password: z.string(),
  queue: z.string().default('Security'),
  priority: z.string().default('3 normal'),
  state: z.string().default('new'),
  mappingMode: ZnunyMappingSchema.default('minimal'),
  fieldMappings: z.record(z.string(), z.string()).optional(),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
});

// Generic outbound webhook — POSTs a stable, versioned JSON payload to any URL
// (SOAR, iPaaS, SIEM, custom endpoint). An optional secret enables an HMAC-SHA256
// body signature (sent as `X-Meldung-Signature: sha256=<hex>`) for authenticity.
const WebhookSchema = z.object({
  url: z.string().url(),
  method: z.enum(['POST', 'PUT']).default('POST'),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().optional(),
  includePdf: z.boolean().default(false),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
});

// Zammad helpdesk REST API (token auth). Creates a ticket with the report as the
// first article, optionally attaching the PDF.
const ZammadSchema = z.object({
  baseUrl: z.string().url(),
  token: z.string(),
  group: z.string().default('Users'),
  customerEmailFallback: z.string().email().optional(),
  includePdf: z.boolean().default(true),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
});

// Each channel is an enabled flag plus its optional channel-specific config.
// The ticket/webhook blocks are defaulted so configs may omit them (absent →
// disabled), keeping the delivery section backward-compatible as channels grow.
const DeliverySchema = z.object({
  email: z.object({ enabled: z.boolean().default(false), smtp: SmtpSchema.optional() }),
  znuny: z
    .object({ enabled: z.boolean().default(false), config: OtrsTicketSchema.optional() })
    .default({}),
  otobo: z
    .object({ enabled: z.boolean().default(false), config: OtrsTicketSchema.optional() })
    .default({}),
  webhook: z
    .object({ enabled: z.boolean().default(false), config: WebhookSchema.optional() })
    .default({}),
  zammad: z
    .object({ enabled: z.boolean().default(false), config: ZammadSchema.optional() })
    .default({}),
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

const CaptchaSchema = z.object({
  // Invisible proof-of-work difficulty: higher = more bot deterrence, slower
  // (still usually <1s) client solve. The client adapts via the challenge.
  difficulty: z.number().int().min(1000).max(5_000_000).default(120_000),
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
  captcha: CaptchaSchema.default({}),
  taxonomy: z.array(TaxonomyCategorySchema).optional(),
  systems: z.array(z.string()).optional(),
  dataCategories: z.array(z.string()).optional(),
  personCategories: z.array(z.string()).optional(),
  referencePrefix: z.string().default('INC'),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type Branding = z.infer<typeof BrandingSchema>;
export type DeliveryConfig = z.infer<typeof DeliverySchema>;
export type OtrsTicketConfig = z.infer<typeof OtrsTicketSchema>;
/** @deprecated Use OtrsTicketConfig — Znuny and OTOBO share this shape. */
export type ZnunyConfig = OtrsTicketConfig;
export type WebhookConfig = z.infer<typeof WebhookSchema>;
export type ZammadConfig = z.infer<typeof ZammadSchema>;
export type SmtpConfig = z.infer<typeof SmtpSchema>;
