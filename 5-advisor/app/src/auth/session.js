const SESSION_TTL_SECONDS = 60 * 60 * 8;

function createSession(userId) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return {
    userId,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
  };
}

function isExpired(session) {
  return Date.now() > session.expiresAt;
}

function refreshSession(session) {
  if (isExpired(session)) {
    throw new Error('Cannot refresh an expired session');
  }
  const issuedAt = Math.floor(Date.now() / 1000);
  return { ...session, issuedAt, expiresAt: issuedAt + SESSION_TTL_SECONDS };
}

module.exports = { createSession, isExpired, refreshSession, SESSION_TTL_SECONDS };
