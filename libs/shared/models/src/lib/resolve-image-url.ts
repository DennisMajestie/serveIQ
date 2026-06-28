export function resolveImageUrl(imageUrl: string | null | undefined, apiBaseUrl: string): string {
  if (!imageUrl) return '/assets/food/placeholder.png';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${apiBaseUrl}${imageUrl}`;
}
