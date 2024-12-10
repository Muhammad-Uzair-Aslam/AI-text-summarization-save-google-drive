// app/api/saveToCloud/route.js
import { google } from "googleapis";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    // Parse the request body
    const { summary } = await req.json();
    if (!summary) {
      return new Response(
        JSON.stringify({ error: "No summary provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Load the service account credentials
    const keyPath = path.join(process.cwd(), "config/text-summarize.json");
    if (!fs.existsSync(keyPath)) {
      return new Response(
        JSON.stringify({ error: "Key file not found" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const credentials = JSON.parse(fs.readFileSync(keyPath, "utf8"));

    // Authenticate with Google Drive
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    const drive = google.drive({ version: "v3", auth });

    // Metadata for the file to be uploaded
    const fileMetadata = {
      name: "summary.txt",
      mimeType: "text/plain",
      parents: ["1EWVgE4fz_e7qDioVmk1sC9HgDV2g1tI1"], // Shared folder ID
    };
    // Upload the file to Google Drive
    const response = await drive.files.create({
      resource: fileMetadata,
      media: { mimeType: "text/plain", body: summary },
      fields: "id",
    });
    // Respond with success
    return new Response(
      JSON.stringify({
        message: "File saved successfully!",
        fileId: response.data.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log and handle errors
    console.error("Error saving file to Google Drive:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to save summary", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
