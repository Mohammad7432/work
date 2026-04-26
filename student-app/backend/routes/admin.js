const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const User = require("../models/User");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");

router.use(authMiddleware, requireRole("admin"));

// create teacher/admin/student manually
router.post("/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "teacher",
      phone = "",
      department = "",
      bio = ""
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone,
      department,
      bio
    });

    res.json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// list users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update user role/profile
router.put("/users/:id", async (req, res) => {
  try {
    const allowed = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      phone: req.body.phone,
      department: req.body.department,
      bio: req.body.bio
    };

    Object.keys(allowed).forEach((key) => {
      if (allowed[key] === undefined) delete allowed[key];
    });

    const user = await User.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete user
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// admin summary
router.get("/summary", async (req, res) => {
  try {
    const [users, courses, modules, lessons, quizzes] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Module.countDocuments(),
      Lesson.countDocuments(),
      Quiz.countDocuments()
    ]);

    res.json({ users, courses, modules, lessons, quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// admin can see all courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;