import { Attendee } from "../models/attendees.model.js";

export const createAttendee = async (req, res) => {
  const { email, phoneNumber, profileImage } = req.body;

  if (!email && !phoneNumber) {
    return res
      .status(400)
      .json({ message: "At least one of email or phone number is required." });
  }

  try {
    const attendee = new Attendee({
      email,
      phoneNumber,
      profileImage,
    });

    await attendee.save();

    return res.status(201).json({
      message: "Attendee created successfully",
      attendee,
    });
  } catch (error) {
    console.error("Error creating attendee:", error);
    return res
      .status(500)
      .json({ message: "Failed to create attendee", error: error.message });
  }
};
