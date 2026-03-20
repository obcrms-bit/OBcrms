const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '');
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'https://*.vercel.app',
];

const matchesOriginPattern = (origin, pattern) => {
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedPattern = normalizeOrigin(pattern);

  if (!normalizedOrigin || !normalizedPattern) {
    return false;
  }

  if (!normalizedPattern.includes('*')) {
    return normalizedOrigin === normalizedPattern;
  }

  const escapedPattern = normalizedPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  return new RegExp(`^${escapedPattern}$`, 'i').test(normalizedOrigin);
};

const buildOriginList = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
    process.env.SOCKET_ORIGIN,
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  return [...new Set([...configuredOrigins, ...DEFAULT_ALLOWED_ORIGINS])];
};

const isOriginAllowed = (origin, allowedOrigins = buildOriginList()) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.some((allowedOrigin) =>
    matchesOriginPattern(origin, allowedOrigin)
  );
};

module.exports = {
  buildOriginList,
  isOriginAllowed,
  matchesOriginPattern,
  normalizeOrigin,
};
