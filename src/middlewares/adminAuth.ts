// // src/middlewares/adminAuth.ts
// import { Request, Response, NextFunction } from "express";
// import * as jwt from "jsonwebtoken";
// import jwksRsa from "jwks-rsa";
// import { AdminNewRequest } from "../utils/interfaces";


// // Create a JWKS client
// const jwksClient = jwksRsa({
// 	cache: true,
// 	rateLimit: true,
// 	jwksRequestsPerMinute: 5,
// 	jwksUri:
// 		"https://sso.staging-api.motopayng.com/.well-known/jwks",
// });

// // Middleware function to authenticate admin
// export const authenticateAdmin = async () => {};
