import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formDataSchema, type FormData } from '@/lib/form/schema';
import { DRAFT_VERSION, migrateDraft } from './draft-migration';

const STORAGE_KEY = 'meldung-draft';

export type FormState = FormData & {
  update: (fields: Partial<FormData>) => void;
  reset: () => void;
  clearDraft: () => void;
};

const initialState: FormData = formDataSchema.parse({});

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...initialState,
      update: (fields) => set({ ...fields, _savedAt: new Date().toISOString() }),
      reset: () => set(initialState),
      clearDraft: () => {
        set(initialState);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: DRAFT_VERSION,
      migrate: (persisted, version) => migrateDraft(persisted, version),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { update, reset, clearDraft, ...rest } = state;
        return rest;
      },
    },
  ),
);
