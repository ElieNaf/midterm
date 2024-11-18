const { User } = require("../models/index");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret_key"; // Replace with a secure key

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

    console.log("Password received for hashing:", password); // Log password to confirm it’s not empty

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

const getAllUsers = async () => {
  try {
    const users = await User.findAll({
      attributes: ["UserID", "Username"],
      raw: true,
    });
    return users;
  } catch (error) {
    console.error(error);
  }
};

const getUserById = async (UserId) => {
  try {
    const user = await User.findByPk(UserId);
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const updateUser = async (UserId, username, email, password) => {
  try {
    const updateData = { Username: username, Email: email };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    const [updated] = await User.update(updateData, {
      where: { UserID: UserId },
    });
    return updated; // Returns 1 if the update was successful, 0 otherwise
  } catch (error) {
    console.error("error updating the user" + error);
    throw error;
  }
};

const deleteUser = async (UserId) => {
  try {
    const user = await User.findByPk(UserId);
    if (UserId) {
      const deleted = await user.destroy();
      return deleted.toJSON();
    }
    return "user not found";
  } catch (error) {
    console.error(error);
  }
};
const loginUser = async (username, password) => {
  const user = await User.findOne({ where: { Username: username } });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.UserID, username: user.Username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {  token, userId: user.UserID, username: user.Username}; // Return userId along with token
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
};
