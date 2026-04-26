const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const Course = require("../models/Course");
const Module = require("../models/Module");
const Quiz = require("../models/Quiz");
const StudentProgress = require("../models/StudentProgress");
const Certificate = require("../models/Certificate");

router.use(authMiddleware);

async function getOrCreateProgress(studentId, courseId) {
  let progress = await StudentProgress.findOne({ studentId, courseId });

  if (!progress) {
    const modules = await Module.find({ courseId }).sort({ order: 1 });

    progress = await StudentProgress.create({
      studentId,
      courseId,
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
  }

  return progress;
}

// Get module quiz
router.get("/module/:moduleId", async (req, res) => {
  try {
    const moduleDoc = await Module.findById(req.params.moduleId);
    if (!moduleDoc) return res.status(404).json({ error: "Module not found" });

    const progress = await getOrCreateProgress(req.user.id, moduleDoc.courseId);
    const moduleProgress = progress.modules.find(
      (m) => m.moduleId.toString() === req.params.moduleId
    );

    if (!moduleProgress || !moduleProgress.unlocked) {
      return res.status(403).json({ error: "This module quiz is locked" });
    }

    const quiz = await Quiz.findOne({
      moduleId: req.params.moduleId,
      type: "module",
      isPublished: true
    });

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

const course = await Course.findById(moduleDoc.courseId);

    res.json({
      quiz,
      progress: moduleProgress,
      module: {
        _id: moduleDoc._id,
        title: moduleDoc.title,
        description: moduleDoc.description || "",
        courseId: moduleDoc.courseId
      },
      course: course ? {
        _id: course._id,
        title: course.title,
        slug: course.slug
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit module quiz
router.post("/module/:moduleId/submit", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      moduleId: req.params.moduleId,
      type: "module",
      isPublished: true
    });

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const moduleDoc = await Module.findById(req.params.moduleId);
    if (!moduleDoc) return res.status(404).json({ error: "Module not found" });

    const answers = req.body.answers || [];
    let totalMarks = 0;
    let obtainedMarks = 0;

    quiz.questions.forEach((q, index) => {
      totalMarks += q.marks || 1;
      if (answers[index] === q.correctAnswer) {
        obtainedMarks += q.marks || 1;
      }
    });

    const score = totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const progress = await getOrCreateProgress(req.user.id, moduleDoc.courseId);
    const moduleIndex = progress.modules.findIndex(
      (m) => m.moduleId.toString() === req.params.moduleId
    );

    if (moduleIndex !== -1) {
      progress.modules[moduleIndex].quizPassed = passed;
      progress.modules[moduleIndex].quizScore = score;
      progress.modules[moduleIndex].completed = passed;

      if (passed && moduleIndex + 1 < progress.modules.length) {
        progress.modules[moduleIndex + 1].unlocked = true;
      }

      const allPassed = progress.modules.every((m) => m.quizPassed);
      if (allPassed) {
        progress.finalExamUnlocked = true;
      }
    }

    await progress.save();

    res.json({
      passed,
      score,
      totalMarks,
      obtainedMarks,
      passingScore: quiz.passingScore
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get final exam by course
router.get("/final/:courseId", async (req, res) => {
  try {
    const progress = await getOrCreateProgress(req.user.id, req.params.courseId);

    if (!progress.finalExamUnlocked) {
      return res.status(403).json({ error: "Final exam is locked until all module quizzes are passed" });
    }

    let finalQuiz = await Quiz.findOne({
      courseId: req.params.courseId,
      type: "final",
      isPublished: true
    });

    // Auto-build final exam if missing
    if (!finalQuiz) {
      const moduleQuizzes = await Quiz.find({
        courseId: req.params.courseId,
        type: "module",
        isPublished: true
      });

      const combinedQuestions = moduleQuizzes.flatMap((quiz) =>
        quiz.questions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          marks: q.marks || 1
        }))
      );

      finalQuiz = await Quiz.create({
        courseId: req.params.courseId,
        moduleId: null,
        title: "Final Exam",
        type: "final",
        passingScore: 70,
        durationMinutes: 60,
        questions: combinedQuestions,
        isPublished: true
      });
    }

    const course = await Course.findById(req.params.courseId);

    res.json({
      quiz: finalQuiz,
      course: course ? {
        _id: course._id,
        title: course.title,
        slug: course.slug
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit final exam
router.post("/final/:courseId/submit", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      courseId: req.params.courseId,
      type: "final",
      isPublished: true
    });

    if (!quiz) return res.status(404).json({ error: "Final exam not found" });

    const answers = req.body.answers || [];
    let totalMarks = 0;
    let obtainedMarks = 0;

    quiz.questions.forEach((q, index) => {
      totalMarks += q.marks || 1;
      if (answers[index] === q.correctAnswer) {
        obtainedMarks += q.marks || 1;
      }
    });

    const score = totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const progress = await getOrCreateProgress(req.user.id, req.params.courseId);
    progress.finalExamPassed = passed;
    progress.finalExamScore = score;

    if (passed) {
      progress.certificateUnlocked = true;

      const existingCertificate = await Certificate.findOne({
        studentId: req.user.id,
        courseId: req.params.courseId
      });

      if (!existingCertificate) {
        await Certificate.create({
          studentId: req.user.id,
          courseId: req.params.courseId,
          certificateId: `ARN-${Date.now()}`,
          finalScore: score
        });
      }
    }

    await progress.save();

    res.json({
      passed,
      score,
      totalMarks,
      obtainedMarks,
      passingScore: quiz.passingScore
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get course progress
router.get("/progress/:courseId", async (req, res) => {
  try {
    const progress = await getOrCreateProgress(req.user.id, req.params.courseId);
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;