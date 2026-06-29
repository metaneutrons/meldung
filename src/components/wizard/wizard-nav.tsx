'use client';

import { createContext, useContext } from 'react';

/** Lets step components jump to another step by id (e.g. the summary's links). */
const WizardNavContext = createContext<((stepId: string) => void) | null>(null);

export const WizardNavProvider = WizardNavContext.Provider;

export function useWizardNav(): ((stepId: string) => void) | null {
  return useContext(WizardNavContext);
}
