const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '');

const buildOriginList = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
    process.env.SOCKET_ORIGIN,
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  if (configuredOrigins.length) {
    return [...new Set(configuredOrigins)];
  }

  return ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'];
};

const isOriginAllowed = (origin, allowedOrigins = buildOriginList()) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(normalizeOrigin(origin));
};

module.exports = {
  buildOriginList,
  isOriginAllowed,
  normalizeOrigin,
};
