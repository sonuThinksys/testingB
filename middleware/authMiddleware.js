const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const authMiddleware = function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) { 
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // store token data for later use
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid Token" });
  }
};

// Middleware to ensure user can only access their own data
const authorizeUser = function (req, res, next) {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: "Forbidden: You can only access your own data" });
  }
  next();
};

module.exports = authMiddleware;
module.exports.authorizeUser = authorizeUser;
