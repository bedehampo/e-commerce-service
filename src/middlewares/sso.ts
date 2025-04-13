// src/middlewares/sso.ts
const express = require("express");
import jwksRsa from "jwks-rsa";
const { expressjwt: jwt } = require("express-jwt");
const app = express();

// JWKS client setup
const jwksClient = jwksRsa.expressJwtSecret({
	cache: true,
	rateLimit: true,
	jwksRequestsPerMinute: 5,
	jwksUri: process.env.JWKS_URI, 
});

// Middleware to verify JWT
export const checkJwt = jwt({
	secret: jwksClient,
	issuer: process.env.ISSUER, 
	algorithms: ["RS256"],
}).unless({ path: ["/"] });



// Middleware to check permissions
export const checkPermissions = (requiredPermissions) => {
	return (req, res, next) => {
		const userPermissions = req.auth?.permissions || [];
		const hasRequiredPermissions =
			requiredPermissions.every((permission) =>
				userPermissions.includes(permission)
			);

		if (!hasRequiredPermissions) {
			return res
				.status(403)
				.json({ error: "Insufficient permissions" });
		}
		next();
	};
};

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err);
	if (err.name === "UnauthorizedError") {
		return res.status(401).json({
			error: "Invalid token",
			details: err.message,
		});
	}
	res.status(500).json({ error: "Internal server error" });
});
