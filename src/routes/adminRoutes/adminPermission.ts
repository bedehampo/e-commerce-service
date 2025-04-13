// import express from "express";
// import { checkPermission } from "../../middlewares/checkPermission";
// import {
//   createPermission,
//   asignPermission,
//   removePermission,
//   updatePermission,
//   deletePermission,
//   getAllPermissions,
//   getSinglePermission,
// } from "../../controllers/adminControllers/adminPermissionController";
// import { authenticateAdmin } from "../../middlewares/adminAuth";

// const router = express.Router();

// router.post(
//   "/",
//   authenticateAdmin,
//   checkPermission("create-permission"),
//   createPermission
// );
// router.patch(
//   "/assign",
//   authenticateAdmin,
//   checkPermission("assign-permission"),
//   asignPermission
// );
// router.patch(
//   "/remove",
//   authenticateAdmin,
//   checkPermission("remove-permission"),
//   removePermission
// );
// router.patch(
//   "/update/:permissionId",
//   authenticateAdmin,
//   checkPermission("update-permission"),
//   updatePermission
// );
// router.delete(
//   "/:permissionId",
//   authenticateAdmin,
//   checkPermission("delete-permission"),
//   deletePermission
// );
// router.get(
//   "/",
//   authenticateAdmin,
//   checkPermission("get-permissions"),
//   getAllPermissions
// );
// router.get(
//   "/:permissionId",
//   authenticateAdmin,
//   checkPermission("get-permission"),
//   getSinglePermission
// );

// export default router;
