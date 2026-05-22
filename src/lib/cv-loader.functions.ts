/**
 * Server function wrappers for CV profile loading.
 *
 * Safe to import from client code. TanStack Start replaces
 * createServerFn implementations with fetch RPC stubs on the client.
 * The .server.ts imports are tree-shaken away.
 */
import { createServerFn } from '@tanstack/react-start';
import { loadCvProfileData } from './cv-loader.server';
import type { CvProfileData } from './cv-loader.server';

/**
 * Server function that loads or creates a CV profile.
 */
export const getCvProfileData = createServerFn().handler(async (): Promise<CvProfileData> => {
  return loadCvProfileData();
});
