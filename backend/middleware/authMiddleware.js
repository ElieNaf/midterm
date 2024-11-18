const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET; // Replace with your actual secret key

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Add user info from token to request
    next();
  });
};

module.exports = authenticateToken;
