import { Attendee } from "../models/attendees.model.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";
import { RekognitionClient, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
import axios from "axios";
import { Event } from "../models/event.model.js";

dotenv.config();

// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.REGION_S3,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_S3,
  },
});

// Configure Rekognition Client
const rekognitionClient = new RekognitionClient({
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

// Function to download image from URL
const downloadImageFromURL = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return response.data;
  } catch (error) {
    console.error("Error downloading image:", error);
    throw new Error("Failed to download image");
  }
};

// Function to search for faces in Rekognition collection
const searchFacesInCollection = async (imageData, collectionId) => {
  try {
    const command = new SearchFacesByImageCommand({
      CollectionId: collectionId,
      Image: { Bytes: imageData },
      MaxFaces: 4096,
      FaceMatchThreshold: 80,
    });

    const response = await rekognitionClient.send(command);
    return response.FaceMatches || [];
  } catch (error) {
    console.error("Error searching faces in collection:", error);
    throw new Error("Failed to search faces");
  }
};

// Function to find matching events and images
export const findAttendeeMatches = async (req, res) => {
  const { attendeeId } = req.params;

  try {
    // Fetch the attendee profile
    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    // Download the attendee's profile image
    const imageData = await downloadImageFromURL(attendee.profileImage);

    // Search for matching faces in Rekognition collection
    const collectionId = 'LPS';
    const faceMatches = await searchFacesInCollection(imageData, collectionId);

    // Extract ImageIds from the matches
    const matchedImageIds = faceMatches.map((match) => match.Face.ImageId);

    // Fetch events and filter images by matched ImageIds
    const events = await Event.find();
    const matchedEvents = events.map((event) => {
      const collections = event.eventCollections.flatMap((collectionGroup) =>
        collectionGroup.map((collection) => ({
          collectionName: collection.collection_name,
          images: collection.images
            .filter((image) => matchedImageIds.includes(image.ImageId))
            .map((image) => image.src_key),
        }))
      );

      return {
        eventName: event.name,
        collections: collections.filter((collection) => collection.images.length > 0),
      };
    }).filter((event) => event.collections.length > 0);

    return res.status(200).json({
      attendeeId,
      matchedEvents,
    });
  } catch (error) {
    console.error("Error finding matches:", error);
    return res.status(500).json({ message: "Failed to find matches", error: error.message });
  }
};
