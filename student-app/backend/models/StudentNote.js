const mongoose = require("mongoose");

const studentNoteSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true
    },
    content: { type: String, default: "" }
  },
  { timestamps: true }
);

studentNoteSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model("StudentNote", studentNoteSchema);