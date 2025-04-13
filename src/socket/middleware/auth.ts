import { Socket } from "socket.io";

import jwt from "jsonwebtoken";
import config from "../../config";

const socketAuthMiddleware = async (socket: Socket, token: string, next) => {
  // Verify the JWT token
  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error"));
    }
    //@ts-ignore
    socket.decoded = decoded;
    next();
  });
};

export default socketAuthMiddleware;