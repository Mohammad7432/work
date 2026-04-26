const mongoose = require("mongoose");

const moduleProgressSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },
    unlocked: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    quizPassed: { type: Boolean, default: false },
    quizScore: { type: Number, default: 0 }
  },
  { _id: false }
);

const studentProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    modules: [moduleProgressSchema],
    finalExamUnlocked: { type: Boolean, default: false },
    finalExamPassed: { type: Boolean, default: false },
    finalExamScore: { type: Number, default: 0 },
    certificateUnlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

studentProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("StudentProgress", studentProgressSchema);