const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Certificate = require("../models/Certificate");
const Course = require("../models/Course");
const User = require("../models/User");

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

router.use(authMiddleware);

// list certificates for logged-in student
router.get("/", async (req, res) => {
  try {
    const certs = await Certificate.find({ studentId: req.user.id }).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      certs.map(async (cert) => {
        const course = await Course.findById(cert.courseId);
        const student = await User.findById(cert.studentId);

        return {
          ...cert.toObject(),
          courseTitle: course?.title || "Course",
          studentName: student?.name || "Student"
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// generate and download certificate PDF
router.get("/download/:courseId", async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const course = await Course.findById(req.params.courseId);
    const cert = await Certificate.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    if (!student || !course || !cert) {
      return res.status(404).json({ error: "Certificate data not found" });
    }

    const templatePath = path.join(__dirname, "..", "templates", "certificate.pdf");
    const existingPdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const nameFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const studentName = student.name || "Student Name";
    const courseTitle = course.title || "Course Title";
    const issuedDate = new Date(cert.issuedAt || cert.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    const certificateId = cert.certificateId || "ARN-000001";

    // ===== TEXT SIZES =====
    const NAME_FONT_SIZE = 30;
    const COURSE_FONT_SIZE = 19;
    const DATE_FONT_SIZE = 13;
    const CERT_ID_FONT_SIZE = 11;

    // ===== TEXT POSITIONS =====
    const NAME_Y = height * 0.55;
    const COURSE_Y = height * 0.385;
    const DATE_Y = height * 0.305;
    const CERT_ID_Y = height * 0.115;

    // ===== COVER OLD TEMPLATE TEXT WITH WHITE RECTANGLES =====
    // Cover old student name area
    page.drawRectangle({
      x: width * 0.26,
      y: height * 0.50,
      width: width * 0.48,
      height: height * 0.09,
      color: rgb(1, 1, 1)
    });

    // Cover old course title area
    page.drawRectangle({
      x: width * 0.20,
      y: height * 0.355,
      width: width * 0.60,
      height: height * 0.06,
      color: rgb(1, 1, 1)
    });

    // Cover old date area
    page.drawRectangle({
      x: width * 0.38,
      y: height * 0.285,
      width: width * 0.24,
      height: height * 0.04,
      color: rgb(1, 1, 1)
    });

    // Optional tiny white patch for bottom-right certificate id area
    page.drawRectangle({
      x: width * 0.74,
      y: height * 0.10,
      width: width * 0.20,
      height: height * 0.03,
      color: rgb(1, 1, 1)
    });

    // ===== MEASURE TEXT =====
    const nameWidth = nameFont.widthOfTextAtSize(studentName, NAME_FONT_SIZE);
    const courseWidth = boldFont.widthOfTextAtSize(courseTitle, COURSE_FONT_SIZE);
    const dateWidth = nameFont.widthOfTextAtSize(issuedDate, DATE_FONT_SIZE);
    const certIdText = `ID: ${certificateId}`;
    const certIdWidth = nameFont.widthOfTextAtSize(certIdText, CERT_ID_FONT_SIZE);

    // ===== DRAW NEW DYNAMIC TEXT =====
    page.drawText(studentName, {
      x: (width - nameWidth) / 2,
      y: NAME_Y,
      size: NAME_FONT_SIZE,
      font: nameFont,
      color: rgb(0.14, 0.20, 0.30)
    });

    page.drawText(courseTitle, {
      x: (width - courseWidth) / 2,
      y: COURSE_Y,
      size: COURSE_FONT_SIZE,
      font: boldFont,
      color: rgb(0.14, 0.20, 0.30)
    });

    page.drawText(issuedDate, {
      x: (width - dateWidth) / 2,
      y: DATE_Y,
      size: DATE_FONT_SIZE,
      font: nameFont,
      color: rgb(0.22, 0.27, 0.35)
    });

    page.drawText(certIdText, {
      x: width - certIdWidth - 45,
      y: CERT_ID_Y,
      size: CERT_ID_FONT_SIZE,
      font: nameFont,
      color: rgb(0.35, 0.40, 0.48)
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${course.title.replace(/[^a-z0-9]/gi, "_")}_certificate.pdf"`
    );

    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate certificate PDF" });
  }
});

module.exports = router;