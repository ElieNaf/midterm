const userService = require("../services/userService"); // Adjust path if necessary

const createUserController = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const newUser = await userService.createUser(username, password, email);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllUsersController = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

const getUserByIdController = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await userService.getUserById(userId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user" });
  }
};

const updateUserController = async (req, res) => {
  const { userId } = req.params;
  const { username, email, password } = req.body;
  console.log("Update request for User ID:", userId);
  console.log("Data to update:", { username, email, password });

  try {
    const updatedUser = await userService.updateUser(
      userId,
      username,
      email,
      password
    );

    console.log("Update result:", updatedUser);

    if (updatedUser === 1) {
      res.status(200).json({ message: "User updated successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error in update controller:", error.message);
    res.status(400).json({ error: error.message });
  }
};

const deleteUserController = async (req, res) => {
  const { userId } = req.params;
  try {
    const deletedUser = await userService.deleteUser(userId);
    if (deletedUser) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
const loginUserController = async (req, res) => {
  const { username, password } = req.body;

  try {
    const {
      token,
      userId,
      username: returnedUsername,
    } = await userService.loginUser(username, password); // Include `username`
    console.log("Login Response:", {
      token,
      userId,
      username: returnedUsername,
    });
    res.json({ success: true, token, userId, username: returnedUsername }); // Send `username` with `returnedUsername`
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

module.exports = {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  loginUserController,
};
