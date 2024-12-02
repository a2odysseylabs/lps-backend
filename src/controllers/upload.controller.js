import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Event } from "../models/event.model.js";
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


// Helper function to check if a folder exists in S3
const folderExistsInS3 = async (bucketName, folderPath) => {
  const params = {
    Bucket: bucketName,
    Prefix: `${folderPath}/`,
    MaxKeys: 1,
  };

  try {
    const command = new ListObjectsV2Command(params);
    const response = await s3.send(command);
    return response.Contents && response.Contents.length > 0;
  } catch (error) {
    console.error("Error checking folder existence in S3:", error);
    throw new Error("Failed to check folder existence in S3");
  }
};

// Helper function to create a folder in S3
const createS3Folder = async (bucketName, folderPath) => {
  const params = {
    Bucket: bucketName,
    Key: `${folderPath}/`,
    Body: ''
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command); // Send the command to S3
    console.log(`Folder created in S3: ${folderPath}`);
  } catch (error) {
    console.error("Error creating S3 folder:", error);
    throw new Error("Failed to create folder in S3");
  }
};

// Controller function to create a new collection in the event
export const createCollectionInEvent = async (req, res) => {
  const { collectionName, folderPath } = req.body;
  const { eventId } = req.params;

  if (!eventId || !collectionName || !folderPath) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const bucketName = process.env.BUCKET_NAME_S3;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const eventFolderPath = `events/${eventId}`;
    const collectionFolderPath = `${eventFolderPath}/${folderPath}`;

    if (await folderExistsInS3(bucketName, collectionFolderPath)) {
      return res.status(400).json({ message: "Folder already exists" });
    }

    await createS3Folder(bucketName, eventFolderPath);
    await createS3Folder(bucketName, collectionFolderPath);

    const collection = {
      collection_name: collectionName,
      collection_folder: collectionFolderPath,
      images: [],
    };

    event.eventCollections.push(collection);
    await event.save();

    return res.status(201).json({ event, message: "Collection created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
