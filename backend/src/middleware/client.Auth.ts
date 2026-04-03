import { Request, Response, NextFunction } from "express";
import { getClientTokenRepo } from "../modules/client/client.repository";

export const clientAuth = async (
  req: any,
  res: Response,
  next: NextFunction
) => {

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const client = await getClientTokenRepo(token);

    if (!client) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.client = client;

    next();

  } catch (err) {
    res.status(500).json({ message: "Auth error" });
  }
};