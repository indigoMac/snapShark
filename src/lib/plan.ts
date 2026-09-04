/** Free vs Pro caps for the dive product. Converter extras stay behind Pro too. */

export const FREE_PHOTO_LIMIT = 25;
export const FREE_COLOUR_BATCH_LIMIT = 3;
export const PRO_COLOUR_BATCH_LIMIT = 50;

export function photoLimitReached(isPro: boolean, photoCount: number): boolean {
  if (isPro) return false;
  return photoCount >= FREE_PHOTO_LIMIT;
}

export function colourBatchAllowed(
  isPro: boolean,
  fileCount: number
): boolean {
  if (fileCount <= FREE_COLOUR_BATCH_LIMIT) return true;
  return isPro && fileCount <= PRO_COLOUR_BATCH_LIMIT;
}
