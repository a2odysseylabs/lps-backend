import { Attendee } from "../models/attendees.model.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.REGION_S3,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_S3,
  },
});

// Helper function to generate a random file name
const generateRandomFileName = (originalName) => {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const fileExtension = originalName.split(".").pop();
  return `${randomBytes}.${fileExtension}`;
};

export const createAttendee = async (req, res) => {
  const { name, email, phoneNumber } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  if (!email && !phoneNumber) {
    return res
      .status(400)
      .json({ message: "At least one of email or phone number is required." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is missing" });
  }

  try {
    // Upload image to S3
    const imageFile = req.file;
    const uniqueFileName = generateRandomFileName(imageFile.originalname);

    const params = {
      Bucket: process.env.BUCKET_NAME_S3,
      Key: `attendees/${uniqueFileName}`,
      Body: imageFile.buffer,
      ContentType: imageFile.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const profileImageUrl = `https://${params.Bucket}.s3.${process.env.REGION_S3}.amazonaws.com/${params.Key}`;

    // Save attendee data
    const attendee = new Attendee({
      name,
      email,
      phoneNumber,
      profileImage: profileImageUrl,
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
