import { Request, Response, NextFunction } from "express"

export const ownershipMiddleware = (
  allowedRoles: string[],
  getResourceOwner?: (req: Request, res: Response, next: NextFunction) => Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user.role.split(',').map((role) => role.trim());

    // ✅ check if user has any allowed role
    if (allowedRoles.some((role) => userRoles.includes(role))) {
      return next();
    }

    // ✅ check if resource ownership applies
    if (getResourceOwner) {
      const authorId = await getResourceOwner(req, res, next);
      if (req.user.id === authorId) {
        return next();
      }
    }

    // ✅ only reach here if unauthorized
    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  };
};
