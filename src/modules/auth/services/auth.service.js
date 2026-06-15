const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../../../config/env');
const AppError = require('../../../common/errors/AppError');
const { toMySQLDatetime } = require('../../../common/datetime');
const authRepository = require('../repositories/auth.repository');

async function buildAuthResponse(user) {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const jti = uuidv4();
  const refreshToken = jwt.sign({ id: user.id, role: user.role, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await authRepository.saveRefreshToken({
    id: jti,
    userId: user.id,
    tokenHash,
    expiresAt: toMySQLDatetime(expiresAt),
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, status: user.status },
  };
}

async function register(payload) {
  const existing = await authRepository.findUserByEmail(payload.email);

  if (existing) {
    throw new AppError('User already exists', 409, [{ field: 'email', reason: 'Email is already registered' }]);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const userId = uuidv4();

  await authRepository.createUser({
    id: userId,
    email: payload.email,
    password_hash: passwordHash,
    role: payload.role,
  });

  const user = await authRepository.findUserByEmail(payload.email);
  return await buildAuthResponse(user);
}

async function login(payload) {
  const user = await authRepository.findUserByEmail(payload.email);

  if (!user) {
    throw new AppError('Invalid credentials', 401, [{ field: 'email', reason: 'No user found for this email' }]);
  }

  // Check if account is temporarily locked
  if (user.lock_until && new Date(user.lock_until) > new Date()) {
    const diffMin = Math.ceil((new Date(user.lock_until).getTime() - Date.now()) / 60000);
    throw new AppError(`Account is temporarily locked. Try again in ${diffMin} minutes.`, 403, [
      { field: 'email', reason: 'Account locked due to too many failed login attempts' },
    ]);
  }

  const isValid = await bcrypt.compare(payload.password, user.password_hash);

  if (!isValid) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;
    if (attempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
    }

    await authRepository.updateFailedAttempts(user.id, attempts, lockUntil ? toMySQLDatetime(lockUntil) : null);

    if (attempts >= 5) {
      throw new AppError('Account locked due to too many failed login attempts. Try again in 15 minutes.', 403, [
        { field: 'email', reason: 'Account locked due to 5 failed attempts' },
      ]);
    }

    throw new AppError('Invalid credentials', 401, [{ field: 'password', reason: 'Incorrect password' }]);
  }

  // Reset failed login attempts on successful login
  if ((user.failed_login_attempts || 0) > 0 || user.lock_until) {
    await authRepository.resetFailedAttempts(user.id);
  }

  return await buildAuthResponse(user);
}

async function refresh(token) {
  if (!token) {
    throw new AppError('Refresh token is required', 401, [{ field: 'refreshToken', reason: 'Missing refresh token' }]);
  }

  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);

    const storedToken = await authRepository.findRefreshToken(payload.jti);

    if (!storedToken || storedToken.revoked_at || new Date(storedToken.expires_at) < new Date()) {
      throw new AppError('Refresh token is invalid, revoked, or expired', 401, [{ field: 'refreshToken', reason: 'Invalid session' }]);
    }

    const accessToken = jwt.sign({ id: payload.id, role: payload.role }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    const newJti = uuidv4();
    const newRefreshToken = jwt.sign({ id: payload.id, role: payload.role, jti: newJti }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    const tokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await authRepository.saveRefreshToken({
      id: newJti,
      userId: payload.id,
      tokenHash,
      expiresAt: toMySQLDatetime(expiresAt),
    });

    await authRepository.revokeRefreshToken(payload.jti, newJti);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid refresh token', 401, [{ field: 'refreshToken', reason: 'Refresh token verification failed' }]);
  }
}

async function logout(token) {
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
      await authRepository.revokeRefreshToken(payload.jti);
    } catch (err) {
      // Ignore errors on verify/revoke during logout, just return success
    }
  }
  return { message: 'Logged out successfully' };
}

module.exports = { register, login, refresh, logout };
