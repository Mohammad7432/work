const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },
    title: { type: String, required: true },
    contentHtml: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    resources: [
      {
        title: String,
        subtitle: String,
        type: String,
        url: String
      }
    ],
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);