import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code ?? 'APP_ERROR',
      message: err.message,
    });
    return;
  }

  logger.error('Unhandled error', { err, path: req.path, method: req.method });
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Ruta ${req.method} ${req.path} no encontrada`,
  });
}
