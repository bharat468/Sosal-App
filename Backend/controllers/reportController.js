import Report from "../models/Report.js";
import User from "../models/User.js";

const VALID_CATEGORIES = new Set([
  "spam",
  "harassment",
  "hate_speech",
  "impersonation",
  "nudity",
  "violence",
  "scam",
  "false_information",
  "other",
]);

// POST /api/users/:id/report
export const reportUser = async (req, res) => {
  const reporterId = req.user._id;
  const reportedUserId = req.params.id;
  const category = String(req.body?.category || "").trim();
  const details = String(req.body?.details || "").trim();

  if (reportedUserId?.toString() === reporterId.toString()) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  if (!VALID_CATEGORIES.has(category)) {
    return res.status(400).json({ message: "Please choose a valid report reason." });
  }

  const reportedUser = await User.findById(reportedUserId).select("username name");
  if (!reportedUser) {
    return res.status(404).json({ message: "User not found." });
  }

  const existingOpenReport = await Report.findOne({
    reporter: reporterId,
    reportedUser: reportedUserId,
    status: { $in: ["pending", "in_review"] },
  });

  const report = existingOpenReport
    ? await Report.findByIdAndUpdate(
        existingOpenReport._id,
        { category, details, status: "pending", adminNote: "", reviewedAt: null },
        { new: true }
      )
    : await Report.create({
        reporter: reporterId,
        reportedUser: reportedUserId,
        category,
        details,
      });

  res.status(existingOpenReport ? 200 : 201).json({
    message: existingOpenReport ? "Your report was updated." : "Report submitted successfully.",
    report: { ...report.toObject(), id: report._id },
  });
};
