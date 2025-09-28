import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  { optional }: { optional: boolean } = { optional: false }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookie = req.headers.cookie;
      if (!cookie) {
        if (optional) return next();
        return res
          .status(403)
          .json({
            success: false,
            message: "Unauthorized",
            redirect: "/?login=true",
          });
      }
      const authRes = await fetch(`${process.env.AUTH_SERVICE}/me`, {
        method: "GET",
        headers: {
          cookie: cookie,
        },
      });
      const session = await authRes.json(); // only once
      
      if (!authRes.ok || !session?.user) {
        if (optional) return next();
        return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
      }
      // attach user to req
      (req as any).user = session.user;

      return next();
    } catch (err) {
      if (optional) return next();
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
