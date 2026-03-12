import { Request, Response } from "express"
import { createOrgSiteManagerService } from "./orgSiteManager.service"
import { AuthRequest } from "../../middleware/auth.middleware"

export const createOrgSiteManager = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      })

    const result =
      await createOrgSiteManagerService(
        user.userId,
        req.body
      )

    res.json(result)

  }
  catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}