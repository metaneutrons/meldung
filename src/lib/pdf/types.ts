import type { FormState } from '@/lib/store/form-store';

export type FormData = Omit<FormState, 'update' | 'reset' | 'clearDraft'>;
