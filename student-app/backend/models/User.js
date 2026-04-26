const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student"
    },
    phone: { type: String, default: "" },
    studentId: { type: String, default: "" },
    department: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);