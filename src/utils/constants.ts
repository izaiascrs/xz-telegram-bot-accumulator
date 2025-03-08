export const PRODUCTION_APP_ID = process.env.DERIV_APP_ID!;
export const STAGING_APP_ID = process.env.DERIV_APP_ID!;
export const VERCEL_DEPLOYMENT_APP_ID = process.env.DERIV_APP_ID!;
export const LOCALHOST_APP_ID = process.env.DERIV_APP_ID!;
export const DERIV_TOKEN = process.env.DERIV_TOKEN!;

export const DEFAULT_WS_SERVER = 'ws.binaryws.com';
export const OAUTH_URL = 'oauth.deriv.com';

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
export const ALLOWED_CHAT_IDS = (process.env.ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(id => Number(id));

export const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || '0');

export const TRADES_TO_MONITOR = 25;
