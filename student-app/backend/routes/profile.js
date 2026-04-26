const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

router.use(authMiddleware);

router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/me", async (req, res) => {
  try {
    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      studentId: req.body.studentId,
      department: req.body.department,
      bio: req.body.bio,
      avatar: req.body.avatar
    };

    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) delete allowedUpdates[key];
    });

    if (allowedUpdates.email) {
      allowedUpdates.email = allowedUpdates.email.toLowerCase().trim();
      const existing = await User.findOne({
        email: allowedUpdates.email,
        _id: { $ne: req.user.id }
      });

      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;