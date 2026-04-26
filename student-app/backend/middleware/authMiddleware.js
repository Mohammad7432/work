const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_secret_key";

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("http://localhost:3000");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("http://localhost:3000");
  }
}

module.exports = authMiddleware;
