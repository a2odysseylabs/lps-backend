import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import {
  createNewClient,
  getAllClients,
} from "../controllers/client.controller.js";
import {
  createNewEvent,
  getAllEvents,
  getEventById,
  getEventDetailsById
} from "../controllers/event.controller.js";
import { createAttendee, findAttendeeMatches } from "../controllers/attendee.controller.js";
import { uploadImageToS3, createCollectionInEvent } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/fileUpload.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.post("/attendees", upload.single("image"), createAttendee);
router.get("/events/:id/details", getEventDetailsById);
router.get("/attendees/:attendeeId/matches", findAttendeeMatches);


// secured routes

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.post("/upload", verifyJWT, upload.single("image"), uploadImageToS3);

// Routes for clients
router.post("/clients", verifyJWT, createNewClient);
router.get("/clients", verifyJWT, getAllClients);

// Routes for events
router.post("/events", verifyJWT, createNewEvent);
router.get("/events", verifyJWT, getAllEvents);
router.get("/events/:id", verifyJWT, getEventById);

// Routes for Collections
router.post("/events/:eventId/collections", verifyJWT, createCollectionInEvent);

export default router;
