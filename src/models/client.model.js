import mongoose, { Schema } from "mongoose";

const clientSchema = new Schema(
  {
    clientName: {
      type: String,
      required: true,
    },
    clientLogo: {
      type: String, // URL to the AWS S3 bucket file
    },
  },
  { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);
