import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'meldung-draft';

export interface FormState {
  // Step 1: Reporter Info
  reporterName: string;
  department: string;
  role: string;
  contact: string;
  reportDate: string;

  // Step 2: Timeline
  discoveryDate: string;
  occurrenceDate: string;
  isOngoing: 'yes' | 'no' | 'unknown' | '';

  // Step 3: Classification
  incidentCategory: string;
  incidentSubType: string;

  // Step 4: Description
  description: string;
  howDiscovered: string;
  attackVector: string;

  // Step 5: Affected Systems
  affectedSystems: string[];
  affectedSystemsOther: string;

  // Step 6: Impact
  functionalImpact: string;
  informationImpact: string;
  recoverability: string;
  personalDataInvolved: 'yes' | 'no' | 'unknown' | '';

  // Step 7: Measures
  measuresTaken: string;
  isResolved: 'yes' | 'no' | '';
  recommendedActions: string;

  // Step 8: GDPR (conditional)
  dataCategories: string[];
  personCategories: string[];
  estimatedRecords: string;
  dpoContact: string;
  isGdprBreach: 'yes' | 'no' | 'unknown' | '';

  // Persistence metadata
  _savedAt: string;

  // Actions
  update: (fields: Partial<Omit<FormState, 'update' | 'reset' | 'clearDraft'>>) => void;
  reset: () => void;
  clearDraft: () => void;
}

const initialState: Omit<FormState, 'update' | 'reset' | 'clearDraft'> = {
  reporterName: '',
  department: '',
  role: '',
  contact: '',
  reportDate: '',
  discoveryDate: '',
  occurrenceDate: '',
  isOngoing: '',
  incidentCategory: '',
  incidentSubType: '',
  description: '',
  howDiscovered: '',
  attackVector: '',
  affectedSystems: [],
  affectedSystemsOther: '',
  functionalImpact: '',
  informationImpact: '',
  recoverability: '',
  personalDataInvolved: '',
  measuresTaken: '',
  isResolved: '',
  recommendedActions: '',
  dataCategories: [],
  personCategories: [],
  estimatedRecords: '',
  dpoContact: '',
  isGdprBreach: '',
  _savedAt: '',
};

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
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { update, reset, clearDraft, ...rest } = state;
        return rest;
      },
    },
  ),
);
