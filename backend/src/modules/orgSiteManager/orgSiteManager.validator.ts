import { Request, Response, NextFunction } from "express"

export const validateAssignSites = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { managerId, siteIds } = req.body

  if (!managerId)
    return res.status(400).json({ message: "managerId is required" })

  if (!Array.isArray(siteIds) || siteIds.length === 0)
    return res.status(400).json({ message: "siteIds must be a non-empty array" })

  next()
}