// services/loginService.js
import axios from "axios";

// Login function to authenticate the user
const login = async (username, password) => {
  try {
    // Send a POST request to the login API with username and password
    const response = await axios.post("http://localhost:3002/api/users/login", {
      username,
      password,
    });

    // Log the response data to confirm its structure
    console.log("Login response data:", response.data);

    // Destructure the response data with fallback values
    const { token, userId, username: returnedUsername = null } = response.data;

    // Check for completeness of the login response
    if (!token || !userId || !returnedUsername) {
      throw new Error("Incomplete login response from server.");
    }

    // Return the essential login data
    return { token, userId, username: returnedUsername };
  } catch (error) {
    console.error("Login error:", error);
    // Throw an error with the server response or a default message
    throw error.response?.data || { message: "Login failed" };
  }
};

export default login;
