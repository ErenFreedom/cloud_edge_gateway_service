import { Request, Response } from 'express';
import {
  loginService,
  verifyLoginOtpService,
  refreshService,
} from './auth.service';

export const login = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;

  const result = await loginService(email, password);

  res.json(result);
};

export const verifyLoginOtp = async (
  req: Request,
  res: Response
) => {
  const { tempLoginId, otp } = req.body;

  const { accessToken, refreshToken } =
    await verifyLoginOtpService(tempLoginId, otp);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
};

export const refresh = async (
  req: Request,
  res: Response
) => {
  const token = req.cookies.refreshToken;

  if (!token)
    return res.status(401).json({
      message: 'No refresh token',
    });

  const result = await refreshService(token);

  res.json(result);
};

export const logout = async (
  req: Request,
  res: Response
) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};