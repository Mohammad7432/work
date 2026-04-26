const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const quizRoutes = require("./routes/quiz");
const certificateRoutes = require("./routes/certificate");
const profileRoutes = require("./routes/profile");

const authMiddleware = require("./middleware/authMiddleware");
const requireRole = require("./middleware/roleMiddleware");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

mongoose.connect("mongodb://127.0.0.1:27017/studentApp")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/profile", profileRoutes);

// static assets only
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));
app.use("/public_pages", express.static(path.join(__dirname, "public", "public_pages")));

// ---------- public pages ----------
app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "public_pages", "home.html"));
});

app.get("/courses", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "public_pages", "course_catalog.html"));
});

app.get("/course-detail", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "public_pages", "course_detail.html"));
});

// ---------- student pages ----------
app.get("/dashboard", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "dashboard.html"));
});

app.get("/my-courses", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "my_courses.html"));
});

app.get("/lesson", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "Module_Lessions.html"));
});

app.get("/module-quiz", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "Module_Quiz.html"));
});

app.get("/final-exam", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "Final_Exam.html"));
});

app.get("/certificate", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "certificate.html"));
});

app.get("/profile", authMiddleware, requireRole("student"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student", "profile.html"));
});

// ---------- teacher pages ----------
app.get("/teacher-dashboard", authMiddleware, requireRole("teacher", "admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teacher", "teacher_dashboard.html"));
});

app.get("/teacher-students", authMiddleware, requireRole("teacher", "admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teacher", "teacher_students.html"));
});

app.get("/teacher-profile", authMiddleware, requireRole("teacher", "admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teacher", "teacher_profile.html"));
});

// ---------- admin pages ----------
app.get("/admin-dashboard", authMiddleware, requireRole("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin_dashboard.html"));
});

app.get("/admin-users", authMiddleware, requireRole("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin_users.html"));
});

app.get("/admin-content", authMiddleware, requireRole("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin_content.html"));
});

app.get("/admin-profile", authMiddleware, requireRole("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin_profile.html"));
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("http://localhost:3000");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


