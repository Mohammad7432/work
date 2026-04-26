const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");

router.use(authMiddleware, requireRole("teacher", "admin"));

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function canManageCourse(user, course) {
  return user.role === "admin" || String(course.teacherId) === String(user.id);
}

// teacher dashboard summary
router.get("/dashboard", async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { teacherId: req.user.id };
    const courses = await Course.find(filter);
    const courseIds = courses.map(c => c._id);

    const [modules, lessons, quizzes] = await Promise.all([
      Module.countDocuments({ courseId: { $in: courseIds } }),
      Lesson.countDocuments({}),
      Quiz.countDocuments({ courseId: { $in: courseIds } })
    ]);

    res.json({
      courses: courses.length,
      publishedCourses: courses.filter(c => c.published).length,
      modules,
      lessons,
      quizzes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// list teacher courses
router.get("/courses", async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { teacherId: req.user.id };
    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create course
router.post("/courses", async (req, res) => {
  try {
    const {
      title,
      category = "General",
      level = "Beginner",
      duration = "Self-paced",
      shortDescription = "",
      description = "",
      thumbnail = "",
      price = 0,
      published = false
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Course title is required" });
    }

    let slug = slugify(title);
    const existing = await Course.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const course = await Course.create({
      title,
      slug,
      category,
      level,
      duration,
      teacherId: req.user.id,
      teacherName: req.user.name || "ArNita Faculty",
      shortDescription,
      description,
      thumbnail,
      price,
      published
    });

    res.json({ message: "Course created", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update course
router.put("/courses/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = {
      title: req.body.title,
      category: req.body.category,
      level: req.body.level,
      duration: req.body.duration,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      thumbnail: req.body.thumbnail,
      price: req.body.price,
      published: req.body.published
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    if (updates.title) {
      const newSlugBase = slugify(updates.title);
      if (newSlugBase && newSlugBase !== course.slug) {
        let newSlug = newSlugBase;
        const existing = await Course.findOne({
          slug: newSlug,
          _id: { $ne: course._id }
        });
        if (existing) newSlug = `${newSlug}-${Date.now()}`;
        updates.slug = newSlug;
      }
    }

    updates.teacherName = req.user.name || course.teacherName;

    const updated = await Course.findByIdAndUpdate(course._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ message: "Course updated", course: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create module
router.post("/courses/:courseId/modules", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const moduleDoc = await Module.create({
      courseId: course._id,
      title: req.body.title,
      description: req.body.description || "",
      order: req.body.order || 0
    });

    res.json({ message: "Module created", module: moduleDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update module
router.put("/modules/:moduleId", async (req, res) => {
  try {
    const moduleDoc = await Module.findById(req.params.moduleId);
    if (!moduleDoc) return res.status(404).json({ error: "Module not found" });

    const course = await Course.findById(moduleDoc.courseId);
    if (!course || !canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await Module.findByIdAndUpdate(
      moduleDoc._id,
      {
        title: req.body.title,
        description: req.body.description,
        order: req.body.order
      },
      { new: true, runValidators: true }
    );

    res.json({ message: "Module updated", module: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create lesson
router.post("/modules/:moduleId/lessons", async (req, res) => {
  try {
    const moduleDoc = await Module.findById(req.params.moduleId);
    if (!moduleDoc) return res.status(404).json({ error: "Module not found" });

    const course = await Course.findById(moduleDoc.courseId);
    if (!course || !canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const lesson = await Lesson.create({
      moduleId: moduleDoc._id,
      title: req.body.title,
      contentHtml: req.body.contentHtml || "",
      videoUrl: req.body.videoUrl || "",
      resources: Array.isArray(req.body.resources) ? req.body.resources : [],
      order: req.body.order || 0
    });

    res.json({ message: "Lesson created", lesson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update lesson
router.put("/lessons/:lessonId", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const moduleDoc = await Module.findById(lesson.moduleId);
    const course = moduleDoc ? await Course.findById(moduleDoc.courseId) : null;

    if (!course || !canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await Lesson.findByIdAndUpdate(
      lesson._id,
      {
        title: req.body.title,
        contentHtml: req.body.contentHtml,
        videoUrl: req.body.videoUrl,
        resources: Array.isArray(req.body.resources) ? req.body.resources : lesson.resources,
        order: req.body.order
      },
      { new: true, runValidators: true }
    );

    res.json({ message: "Lesson updated", lesson: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create/update module quiz
router.post("/modules/:moduleId/quiz", async (req, res) => {
  try {
    const moduleDoc = await Module.findById(req.params.moduleId);
    if (!moduleDoc) return res.status(404).json({ error: "Module not found" });

    const course = await Course.findById(moduleDoc.courseId);
    if (!course || !canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const payload = {
      courseId: course._id,
      moduleId: moduleDoc._id,
      title: req.body.title || `${moduleDoc.title} Quiz`,
      type: "module",
      passingScore: req.body.passingScore ?? 70,
      durationMinutes: req.body.durationMinutes ?? 15,
      isPublished: req.body.isPublished ?? true,
      questions: Array.isArray(req.body.questions) ? req.body.questions : []
    };

    const existing = await Quiz.findOne({
      moduleId: moduleDoc._id,
      type: "module"
    });

    let quiz;
    if (existing) {
      quiz = await Quiz.findByIdAndUpdate(existing._id, payload, {
        new: true,
        runValidators: true
      });
    } else {
      quiz = await Quiz.create(payload);
    }

    res.json({ message: "Module quiz saved", quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create/update final exam
router.post("/courses/:courseId/final-quiz", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const payload = {
      courseId: course._id,
      moduleId: null,
      title: req.body.title || `${course.title} Final Exam`,
      type: "final",
      passingScore: req.body.passingScore ?? 70,
      durationMinutes: req.body.durationMinutes ?? 120,
      isPublished: req.body.isPublished ?? true,
      questions: Array.isArray(req.body.questions) ? req.body.questions : []
    };

    const existing = await Quiz.findOne({
      courseId: course._id,
      type: "final"
    });

    let quiz;
    if (existing) {
      quiz = await Quiz.findByIdAndUpdate(existing._id, payload, {
        new: true,
        runValidators: true
      });
    } else {
      quiz = await Quiz.create(payload);
    }

    res.json({ message: "Final exam saved", quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// full course content for dashboard editing
router.get("/courses/:courseId/content", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    const moduleIds = modules.map(m => m._id);
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 });
    const quizzes = await Quiz.find({
      $or: [
        { courseId: course._id, type: "final" },
        { moduleId: { $in: moduleIds }, type: "module" }
      ]
    });

    const modulesWithChildren = modules.map((moduleDoc) => ({
      ...moduleDoc.toObject(),
      lessons: lessons.filter(l => String(l.moduleId) === String(moduleDoc._id)),
      quiz: quizzes.find(q => q.moduleId && String(q.moduleId) === String(moduleDoc._id)) || null
    }));

    const finalQuiz = quizzes.find(q => q.type === "final") || null;

    res.json({
      course,
      modules: modulesWithChildren,
      finalQuiz
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;