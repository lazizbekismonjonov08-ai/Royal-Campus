/**
 * Resolves static asset URLs safely across root deployments and subpaths (e.g. GitHub Pages).
 */
export function resolveAssetPath(path: string): string {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const cleanPath = path.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${cleanPath}`;
}
