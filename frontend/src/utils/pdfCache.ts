/**
 * A simple in-memory cache for storing PDF object URLs.
 * This prevents re-downloading and re-creating URLs for the same PDF
 * when navigating between conversations.
 */
export const globalPDFCache = new Map<string, string>(); 