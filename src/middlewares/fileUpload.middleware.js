import multer from "multer";

// Set up multer to store files in memory
const storage = multer.memoryStorage();

export const upload = multer({ storage });
