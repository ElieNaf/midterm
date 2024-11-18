import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import HomePage from "./components/pages/HomePage"; // Corrected path
import Login from "./components/user/login"; // Corrected path
import Signup from "./components/user/signup"; // Corrected path
import WhiteboardSession from "./components/pages/whiteboardSession/WhiteboardSession";

function App() {
  // Check initial authentication status from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Redirect to /home or /login based on authentication */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Login route */}
        <Route
          path="/login"
          element={
            <Login
              onLogin={handleLogin} // Call handleLogin when logged in successfully
            />
          }
        />

        {/* Signup route */}
        <Route
          path="/signup"
          element={<Signup onSignup={handleLogin} />} // Optional: Trigger login after signup
        />

        {/* Protected /home route */}
        <Route
          path="/home"
          element={
            isAuthenticated ? <HomePage onLogout={handleLogout} /> : <Navigate to="/login" replace />
          }
        />

        {/* Whiteboard session route */}
        <Route
          path="/whiteboard/:roomId"
          element={
            isAuthenticated ? (
              <WhiteboardSession />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
