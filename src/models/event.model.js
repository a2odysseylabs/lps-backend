import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    eventCollections: {
      type: [[Schema.Types.Mixed]], // Array of arrays, can hold any type
      default: [],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client", // Reference to the Client model
      required: true,
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
