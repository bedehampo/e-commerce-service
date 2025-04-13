import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { AdminNewRequest } from "../utils/interfaces";


// Create a JWKS client
const jwksClient = jwksRsa({
	cache: true,
	rateLimit: true,
	jwksRequestsPerMinute: 5,
	jwksUri:
		"https://sso.staging-api.motopayng.com/.well-known/jwks",
});

// Middleware function to authenticate admin
export const authenticateAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			
			return res.status(401).json({
				message: "Missing or invalid authorization header",
			});
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.decode(token, { complete: true });

		if (!decoded || !decoded.header) {
			
			return res
				.status(401)
				.json({ message: "Invalid token" });
		}

		const kid = decoded.header.kid;

		// Retrieve the signing key from JWKs URI
		jwksClient.getSigningKey(kid, (err, key) => {
			if (err || !key) {
				return res.status(401).json({
					message:
						"Unauthorized: Could not retrieve signing key",
				});
			}

			const signingKey = key.getPublicKey();

			// Verify the token with the signing key
			jwt.verify(
				token,
				signingKey,
				{
					algorithms: ["RS256"],
					issuer: "https://sso.staging-api.motopayng.com/",
				},
				(err, payload) => {
					if (err) {
						return res.status(401).json({
							message: "Invalid or expired token",
						});
					}
					req.user = payload as {
						sub: string;
						permissions?: string[];
					};
					next();
				}
			);
		});
	} catch (error) {
		console.error(
			"Error in authenticateAdmin middleware:",
			error
		);
		return res
			.status(500)
			.json({ message: "Internal server error" });
	}
};

export const checkAdminPermissions = (
	requiredPermissions: string[]
) => {
	return (
		req: AdminNewRequest,
		res: Response,
		next: NextFunction
	) => {
		// Check if the user is authenticated and has permissions in the token payload
		const userPermissions = req.user?.permissions;

		if (!userPermissions) {
			return res.status(403).json({
				message: "Forbidden: User permissions not found",
			});
		}

		// Verify if the user has all required permissions
		const hasAllPermissions = requiredPermissions.every(
			(permission) => userPermissions.includes(permission)
		);

		if (!hasAllPermissions) {
			return res.status(403).json({
				message:
					"Forbidden: You do not have the necessary permissions",
			});
		}

		// User has all required permissions; proceed to the next middleware or route
		next();
	};
};