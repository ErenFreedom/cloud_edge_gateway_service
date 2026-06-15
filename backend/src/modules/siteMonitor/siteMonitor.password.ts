import crypto from "crypto";
import bcrypt from "bcrypt";

export const generateSystemPassword = (): string => {
  const part1 = crypto.randomBytes(4).toString("hex");
  const part2 = crypto.randomBytes(4).toString("hex");

  return `Mon-${part1}-${part2}`;
};

export const hashPassword = async (
  password: string
): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const generateOtp = (): string => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};