import jwt from "jsonwebtoken";
import config from "./env.js";

const ACCESS_TOKEN_EXPIRE = config.JWT_ACCESS_EXPIRE;
const REFRESH_TOKEN_EXPIRE = config.JWT_REFRESH_EXPIRE;

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE,
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE,
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error("Invalid access token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};
