import express from "express";
import logger from "./utils/logger";
import createServer from "./utils/createServer";
import connectDB from "./config/db";
import socketAuthMiddleware from "./socket/middleware/auth";
import handleSocket from "./socket";
import http from "http";

const app = createServer();

const server = http.createServer(app);
const io = require("socket.io")(server, {
	cors: { origin: "*" },
});

io.use((socket: any, next: any) => {
	const token = socket.handshake.auth.token;
	// console.log("hello");
	// console.log({
	//   token,
	// });
	socketAuthMiddleware(socket, token, next);
	next();
});

io.on("connection", (socket) => {
	// console.log("a user connected", socket.decoded);
	//console.log("hello");
	handleSocket(socket, socket.decoded);
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, async () => {
	logger.info(`App is running at http://localhost:${PORT}`);

	await connectDB();
});
