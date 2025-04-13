import { Socket } from "socket.io";
import { getProductsSocket } from "./productSocket";
// import {  getFeedsSocket } from "./postSocket";

const handleSocket = (socket: Socket, user?: any) => {
  getProductsSocket(socket, user);
  // getFeedsSocket(socket);
  // getCommentsSocket(socket);
  // getLikesSocket(socket);
};

export default handleSocket;