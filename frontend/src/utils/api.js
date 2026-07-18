export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Resolves a URL to be absolute (using API_BASE) if it's a relative path.
 * If API_BASE is empty (e.g. during local development), it returns the relative path,
 * which leverages the Vite dev server proxy.
 *
 * @param {string} path - The URL path to resolve (e.g. '/api/v1/foo' or '/static/uploads/bar.png')
 * @returns {string} The resolved absolute or relative URL
 */
export const resolveUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  
  const cleanBase = API_BASE.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  
  return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
};
