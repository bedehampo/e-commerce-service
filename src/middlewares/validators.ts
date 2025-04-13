import {
	AuthorizationError,
	NotFoundError,
	ValidationError,
} from "../errors";
import { AdminService } from "../lib/adminService";
import { UserService } from "../lib/userService";

export const checkUserById = async (
	id: number,
	userService: UserService
) => {
	const user = await userService.getUserById(id);
	if (!user) {
		throw new NotFoundError("User not found");
	} else if (!user.phoneVerified) {
		throw new AuthorizationError("User not verified");
	} else {
		return user;
	}
};

export const checkUserByIdNew = async (id: number) => {
	console.log("Id before before userService", id);
	const userService = new UserService();
	console.log("Id before after userService", id);
	const user = await userService.getUserById(id);
	console.log("Id before after userService.getUserId", id);
	console.log(id);
	if (!user) {
		throw new NotFoundError("User not found");
	} else if (!user.phoneVerified) {
		throw new AuthorizationError("User not verified");
	} else {
		return user;
	}
};

export const checkAdminUser = async (
	id: string,
	adminServices: AdminService
) => {
	const user = await adminServices.getUserById(id);
	if (!user) {
		throw new NotFoundError("User not found");
	} else if (user.status == "unverified") {
		throw new ValidationError("user not verified");
	} else if (user.status == "suspended") {
		throw new ValidationError("Suspended user");
	} else if (user.status == "resigned") {
		throw new ValidationError("Resigned user");
	} else if (user.status == "sacked") {
		throw new ValidationError("Sacked user");
	} else {
		return user;
	}
};
