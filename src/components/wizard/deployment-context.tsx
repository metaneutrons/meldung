'use client';

import { createContext, useContext } from 'react';

/** Deployment settings the wizard steps need, taken from the server-side config. */
export interface DeploymentSettings {
  /** Number to call for an incident in progress (contact.emergencyPhone). */
  emergencyPhone?: string | undefined;
}

const DeploymentContext = createContext<DeploymentSettings>({});

export const DeploymentProvider = DeploymentContext.Provider;

export function useDeployment(): DeploymentSettings {
  return useContext(DeploymentContext);
}
