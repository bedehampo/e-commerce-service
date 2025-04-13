import { AdminUser } from "../model/admin/adminUser";
import { ValidationError } from "../errors";

export const checkAdmin = async (
	currentUserId
) => {
	const currentUser = await AdminUser.findOne({
		_id: currentUserId,
		tag: "admin-user",
		status: "verified",
	});

	if (!currentUser) {
		throw new ValidationError("User not found");
	}

	return currentUser;
};
