import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export type customError = {
      message?: string;
      statusCode?: number;
    } | ZodError;

export const errorhandler = (
  err: customError,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0].message,
    });
  }

  const statusCode = (err as any)?.statusCode || 500;
  const message = (err as any)?.message || "Unknown server error";
  // console.error(message);
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
