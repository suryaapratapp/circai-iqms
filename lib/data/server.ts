import { cache } from "react";
import { requireSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data";
import type { WorkflowType } from "@/lib/data/types";

export const getCachedSession = cache(async () => requireSession());

export const getCachedAccessibleLocations = cache(async () => {
  const session = await getCachedSession();
  return getRepository().getAccessibleLocations(session);
});

export const getCachedLookups = cache(async () => {
  const session = await getCachedSession();
  return getRepository().getLookups(session);
});

export const getCachedWorkflowLookups = cache(async (workflow: WorkflowType) => {
  const session = await getCachedSession();
  return getRepository().getWorkflowLookups(session, workflow);
});
