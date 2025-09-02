import { Request, Response, NextFunction } from "express";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(403).json({success: false, message: "Unauthorized", redirect: '/?login=true'});
    }
    const authRes = await fetch(`${process.env.AUTH_SERVICE}/api/me`, {
      method: "GET",
      headers: {
        cookie: cookie,
      },
    });

    if (!authRes.ok) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await authRes.json();

    // attach user to req
    (req as any).user = session.user;

    next();
  } catch (err) {
    console.error("Auth check failed:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
