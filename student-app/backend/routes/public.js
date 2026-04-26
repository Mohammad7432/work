const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");

// Get all published courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({ published: true }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one course by slug with modules and lessons
router.get("/courses/:slug", async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, published: true });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    const moduleIds = modules.map((m) => m._id);

    const lessons = await Lesson.find({
      moduleId: { $in: moduleIds }
    }).sort({ order: 1 });

    const modulesWithLessons = modules.map((module) => ({
      ...module.toObject(),
      lessons: lessons.filter(
        (lesson) => lesson.moduleId.toString() === module._id.toString()
      )
    }));

    res.json({
      course,
      modules: modulesWithLessons
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one lesson by ID with module, course, prev, next
router.get("/lesson/:id", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const moduleDoc = await Module.findById(lesson.moduleId);
    const course = moduleDoc ? await Course.findById(moduleDoc.courseId) : null;

    const siblingLessons = await Lesson.find({ moduleId: lesson.moduleId }).sort({ order: 1 });

    const lessonIndex = siblingLessons.findIndex(
      (item) => item._id.toString() === lesson._id.toString()
    );

    const prevLesson = lessonIndex > 0 ? siblingLessons[lessonIndex - 1] : null;
    const nextLesson =
      lessonIndex >= 0 && lessonIndex < siblingLessons.length - 1
        ? siblingLessons[lessonIndex + 1]
        : null;

    res.json({
      lesson,
      module: moduleDoc,
      course,
      prevLesson,
      nextLesson
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;