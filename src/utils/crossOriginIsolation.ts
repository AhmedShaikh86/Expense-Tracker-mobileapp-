/**
 * Only needed on web (see crossOriginIsolation.web.ts). On phones there is
 * nothing to do.
 */
export async function ensureCrossOriginIsolated(): Promise<void> {}
