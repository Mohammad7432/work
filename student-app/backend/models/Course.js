const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, default: "General" },
    level: { type: String, default: "Beginner" },
    duration: { type: String, default: "Self-paced" },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    teacherName: { type: String, default: "ArNita Faculty" },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8 },
    published: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);