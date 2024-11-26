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
} from "../controllers/event.controller.js";
import { uploadImageToS3 } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/fileUpload.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

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


export default router;
