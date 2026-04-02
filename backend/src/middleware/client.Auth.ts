import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const clientAuth = (req: any, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (!decoded.organization_id || !decoded.site_id) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.client = decoded;

    next();

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};