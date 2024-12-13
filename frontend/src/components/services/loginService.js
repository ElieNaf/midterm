// services/loginService.js
import axios from "axios";

// Use environment variable for base URL or fallback to localhost
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3002";
const LOGIN_URL = `${BASE_URL}/api/users/login`;

// Login function to authenticate the user
const login = async (username, password) => {
  try {
    const response = await axios.post(LOGIN_URL, {
      username,
      password,
    });

    console.log("Login response data:", response.data);

    const { token, userId, username: returnedUsername = null } = response.data;

    if (!token || !userId || !returnedUsername) {
      throw new Error("Incomplete login response from server.");
    }

    return { token, userId, username: returnedUsername };
  } catch (error) {
    console.error("Login error:", error);
    throw error.response?.data || { message: "Login failed" };
  }
};

export default login;
