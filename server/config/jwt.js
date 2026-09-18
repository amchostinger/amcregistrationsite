/**
 * config/jwt.js — single source of truth for the token signing secret.
 *
 * Previously both the login route and the auth middleware fell back to a
 * hardcoded placeholder when JWT_SECRET was unset. That fallback is published
 * in this repository, so any deployment that lost its environment would keep
 * serving traffic while accepting admin tokens an outsider could mint. Refuse
 * to start instead: a boot failure is loud and recoverable, silent forgeable
 * auth is neither.
 */

const MIN_SECRET_LENGTH = 32;
const PLACEHOLDER = 'changeme-use-a-long-random-secret-in-production';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === PLACEHOLDER || JWT_SECRET.length < MIN_SECRET_LENGTH) {
  console.error(
    `❌ JWT_SECRET is missing, the published placeholder, or shorter than ${MIN_SECRET_LENGTH} characters. ` +
    'Set a long random value in .env before starting the server.'
  );
  process.exit(1);
}

module.exports = { JWT_SECRET, JWT_EXPIRES: '12h' };
