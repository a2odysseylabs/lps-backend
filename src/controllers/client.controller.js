import { Client } from "../models/client.model.js";

export const createNewClient = async (req, res) => {
  const { clientName, clientLogo } = req.body;

  if (!clientName || !clientLogo) {
    return res.status(400).json({ message: "Client name and logo are required" });
  }

  try {
    // Check if the client name already exists
    const existingClient = await Client.findOne({ clientName });
    if (existingClient) {
      return res.status(400).json({ message: "Client name already exists" });
    }

    // Create the new client
    const client = await Client.create({
      clientName,
      clientLogo, // This should be the URL from the S3 upload
    });

    return res.status(201).json({ client, message: "Client created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Fetch all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find();
    return res.status(200).json({ clients });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
