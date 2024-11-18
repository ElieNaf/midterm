const express = require("express");
const userController = require("../controllers/userController");
const validate = require("../middleware/validate");
const {
  createUserValidation,
  loginValidation,
  updateUserValidation,
} = require("../validators/userValidator");

const router = express.Router();

router.post("/", validate(createUserValidation), userController.createUserController);
router.post("/login", validate(loginValidation), userController.loginUserController);
router.put("/:userId", validate(updateUserValidation), userController.updateUserController);

router.get("/", userController.getAllUsersController);
router.get("/:userId", userController.getUserByIdController);
router.delete("/:userId", userController.deleteUserController);

module.exports = router;
