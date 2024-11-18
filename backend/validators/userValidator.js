const { body } = require("express-validator");

// Validation rules for creating a user
const createUserValidation = [
  body("username")
    .isString()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("email")
    .isEmail()
    .withMessage("Email must be a valid email address"),
];

// Validation rules for login
const loginValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validation rules for updating a user
const updateUserValidation = [
  body("username")
    .optional()
    .isString()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Email must be a valid email address"),
  body("password")
    .optional()
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

module.exports = {
  createUserValidation,
  loginValidation,
  updateUserValidation,
};
