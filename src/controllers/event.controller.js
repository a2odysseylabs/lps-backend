import { Event } from "../models/event.model.js";
import { Client } from "../models/client.model.js";

export const createNewEvent = async (req, res) => {
  const { name, startDate, endDate, clientId } = req.body;

  if (!name || !startDate || !endDate || !clientId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the client exists
    const clientExists = await Client.findById(clientId);
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if the event name is unique
    const existingEvent = await Event.findOne({ name });
    if (existingEvent) {
      return res.status(400).json({ message: "Event name already exists" });
    }

    // Create the new event
    const event = await Event.create({
      name,
      startDate,
      endDate,
      clientId,
    });

    return res
      .status(201)
      .json({ event, message: "Event created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Fetch all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("clientId", "clientName clientLogo"); // Populate client name and logo
    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Fetch a single event by ID
export const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id).populate(
      "clientId",
      "clientName clientLogo"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getEventDetailsById = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the event by ID
    const event = await Event.findById(id).populate("clientId", "clientName");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Extract collections and their src_key values
    const collectionsData = event.eventCollections.map((collectionArray) =>
      collectionArray.map((collection) => ({
        collectionName: collection.collection_name,
        srcKeys: collection.images.map((image) => image.src_key),
      }))
    );

    // Prepare response
    const response = {
      eventName: event.name,
      clientName: event.clientId?.clientName || "Unknown Client",
      collections: collectionsData,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching event details:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};