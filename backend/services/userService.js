// services/userService.js
const { User } = require("../models/index");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Creates a new user, ensuring username and email are unique, and hashes the password
const createUser = async (username, password, email) => {
  try {
    if (!password) {
      throw new Error("Password is required for user creation");
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ Username: username }, { Email: email }] },
    });
    if (existingUser) {
      throw new Error("User already exists with the given username or email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      Username: username,
      passwordHash: hashedPassword,
      Email: email,
    });
    return newUser.get({ plain: true });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Fetches all users with limited attributes
const getAllUsers = async () => {
  try {
    return await User.findAll({
      attributes: ["UserID", "Username"],
      raw: true,
    });
  } catch (error) {
    console.error(error);
  }
};

// Fetches a specific user by their ID
const getUserById = async (UserId) => {
  try {
    return await User.findByPk(UserId);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Updates a user by their ID and optionally hashes a new password
const updateUser = async (UserId, username, email, password) => {
  try {
    const updateData = { Username: username, Email: email };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    const [updated] = await User.update(updateData, {
      where: { UserID: UserId },
    });
    return updated;
  } catch (error) {
    console.error("Error updating the user:", error);
    throw error;
  }
};

// Deletes a user by their ID
const deleteUser = async (UserId) => {
  try {
    const user = await User.findByPk(UserId);
    if (user) {
      await user.destroy();
      return user.toJSON();
    }
    return "User not found";
  } catch (error) {
    console.error(error);
  }
};

// Logs in a user by verifying credentials and generating a JWT
const loginUser = async (username, password) => {
  const user = await User.findOne({ where: { Username: username } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.UserID, username: user.Username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token, userId: user.UserID, username: user.Username };
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
};
