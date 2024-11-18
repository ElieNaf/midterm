// services/loginService.js
import axios from 'axios';

const login = async (username, password) => {
  try {
    const response = await axios.post("http://localhost:3002/api/users/login", {
      username,
      password,
    });
    
    // Log the full response to confirm the structure
    console.log("Login response data:", response.data);

    // Destructure with a fallback to prevent ReferenceError
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
