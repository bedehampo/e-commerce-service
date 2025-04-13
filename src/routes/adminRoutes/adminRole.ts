// import express from "express";
// import { checkPermission } from "../../middlewares/checkPermission";
// import {
// 	createRole,
// 	asignRole,
// 	removeRole,
// 	reassignRole,
// 	updateRole,
// 	deleteRole,
// 	getAllRoles,
// 	getSingleRole,
// } from "../../controllers/adminControllers/adminRoleController";
// import { authenticateAdmin } from "../../middlewares/adminAuth";

// const router = express.Router();

// router.post(
// 	"/",
// 	// authenticateAdmin,
// 	// checkPermission("create-role"),
// 	createRole
// );
// router.patch(
// 	"/assign-role",
// 	authenticateAdmin,
// 	checkPermission("assign-role"),
// 	asignRole
// );
// router.patch(
// 	"/remove-role/:userId",
// 	authenticateAdmin,
// 	checkPermission("remove-role"),
// 	removeRole
// );
// router.patch(
// 	"/reassign-role",
// 	authenticateAdmin,
// 	checkPermission("reassign-role"),
// 	reassignRole
// );
// router.patch(
// 	"/update-role/:roleId",
// 	authenticateAdmin,
// 	checkPermission("update-role"),
// 	updateRole
// );
// router.delete(
// 	"/:roleId",
// 	authenticateAdmin,
// 	checkPermission("delete-role"),
// 	deleteRole
// );
// router.get(
// 	"/",
// 	authenticateAdmin,
// 	checkPermission("get-roles"),
// 	getAllRoles
// );
// router.get(
// 	"/:roleId",
// 	authenticateAdmin,
// 	checkPermission("get-single-role"),
// 	getSingleRole
// );

// export default router;
