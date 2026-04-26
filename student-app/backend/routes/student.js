const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const StudentNote = require("../models/StudentNote");
const StudentProgress = require("../models/StudentProgress");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");
const Module = require("../models/Module");

router.use(authMiddleware);

// dashboard summary
router.get("/dashboard", async (req, res) => {
  try {
    const progresses = await StudentProgress.find({ studentId: req.user.id });
    const certificates = await Certificate.find({ studentId: req.user.id });

    const enrolledCourses = progresses.length;
    const completedModules = progresses.reduce(
      (sum, progress) => sum + progress.modules.filter((m) => m.quizPassed).length,
      0
    );
    const finalUnlocked = progresses.filter((p) => p.finalExamUnlocked).length;

    res.json({
      courses: enrolledCourses,
      completedModules,
      finalUnlocked,
      certificates: certificates.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// student's enrolled courses + progress
router.get("/my-courses", async (req, res) => {
  try {
    const progresses = await StudentProgress.find({ studentId: req.user.id }).sort({ updatedAt: -1 });

    const items = await Promise.all(
      progresses.map(async (progress) => {
        const course = await Course.findById(progress.courseId);
        if (!course) return null;

        return {
          course,
          progress,
          modulesCount: progress.modules.length
        };
      })
    );

    res.json(items.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get current student's note for a lesson
router.get("/lessons/:lessonId/note", async (req, res) => {
  try {
    const note = await StudentNote.findOne({
      studentId: req.user.id,
      lessonId: req.params.lessonId
    });

    res.json(note || { content: "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// save/update current student's note
router.put("/lessons/:lessonId/note", async (req, res) => {
  try {
    const note = await StudentNote.findOneAndUpdate(
      {
        studentId: req.user.id,
        lessonId: req.params.lessonId
      },
      {
        content: req.body.content || ""
      },
      {
        new: true,
        upsert: true
      }
    );

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/enroll/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || !course.published) {
      return res.status(404).json({ error: "Course not found" });
    }

    const existing = await StudentProgress.findOne({
      studentId: req.user.id,
      courseId: course._id
    });

    if (existing) {
      return res.json({ message: "Already enrolled", progress: existing });
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });

    const progress = await StudentProgress.create({
      studentId: req.user.id,
      courseId: course._id,
      modules: modules.map((m, index) => ({
        moduleId: m._id,
        unlocked: index === 0,
        completed: false,
        quizPassed: false,
        quizScore: 0
      })),
      finalExamUnlocked: false,
      finalExamPassed: false,
      finalExamScore: 0,
      certificateUnlocked: false
    });

    res.json({ message: "Enrolled successfully", progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;