import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';

// Mock DB to avoid needing a real connection in unit tests
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));

import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../src/utils/jwt';

process.env['JWT_SECRET'] = 'test_secret_key_for_unit_tests_must_be_long_enough_12345';
process.env['JWT_REFRESH_SECRET'] = 'test_refresh_secret_for_unit_tests_must_be_long_enough';

describe('JWT Utils', () => {
  it('should generate valid tokens', () => {
    const tokens = generateTokens('user-123', 'test@example.com', 'client');
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.expiresIn).toBe(900);
  });

  it('should verify access token and return payload', () => {
    const tokens = generateTokens('user-123', 'test@example.com', 'creator');
    const payload = verifyAccessToken(tokens.accessToken);
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('test@example.com');
    expect(payload.role).toBe('creator');
  });

  it('should verify refresh token', () => {
    const tokens = generateTokens('user-456', 'other@example.com', 'client');
    const payload = verifyRefreshToken(tokens.refreshToken);
    expect(payload.sub).toBe('user-456');
  });

  it('should throw on invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});

describe('Error classes', () => {
  it('AppError should have correct statusCode', async () => {
    const { AppError, NotFoundError, UnauthorizedError } = await import('../src/utils/errors');
    const err = new AppError(400, 'Test error', 'TEST');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST');

    const notFound = new NotFoundError('User');
    expect(notFound.statusCode).toBe(404);

    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);
  });
});
