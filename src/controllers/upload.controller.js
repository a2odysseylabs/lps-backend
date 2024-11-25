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
  const fileExtension = originalName.split(".").pop(); // Extract file extension
  return `${randomBytes}.${fileExtension}`;
};

// Upload image to S3
export const uploadImageToS3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is missing" });
    }

    const imageFile = req.file;
    const uniqueFileName = generateRandomFileName(imageFile.originalname);

    const params = {
      Bucket: process.env.BUCKET_NAME_S3_LOGOS,
      Key: `logos/${uniqueFileName}`,
      Body: imageFile.buffer,
      ContentType: imageFile.mimetype,
    };

    const command = new PutObjectCommand(params);
    const uploadResult = await s3.send(command);

    return res.status(200).json({
      message: "File uploaded successfully",
      url: `https://${params.Bucket}.s3.${process.env.REGION_S3}.amazonaws.com/${params.Key}`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading file", error });
  }
};
