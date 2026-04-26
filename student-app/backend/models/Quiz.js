const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, default: "" },
    marks: { type: Number, default: 1 },
    topic: { type: String, default: "" },
    moduleName: { type: String, default: "" }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      default: null
    },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["module", "final"],
      required: true
    },
    passingScore: { type: Number, default: 70 },
    durationMinutes: { type: Number, default: 15 },
    questions: [questionSchema],
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);