const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ Define Song Schema
const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  filePath: String, // Store path instead of Binary
});
const Song = mongoose.model("Song", songSchema);

// ✅ Multer Storage Config
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Prevent duplicate names
  },
});
const upload = multer({ storage });

// ✅ Upload Song API
app.post("/api/songs/upload", upload.single("song"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "❌ No file uploaded!" });
    }

    const { title, artist } = req.body;
    const newSong = new Song({
      title,
      artist,
      filePath: req.file.path,
    });

    await newSong.save();
    res.status(201).json({ message: "✅ Song uploaded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "❌ Upload failed!" });
  }
});

// ✅ Get All Songs API
app.get("/api/songs", async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "❌ Error fetching songs" });
  }
});

// ✅ Stream Song API
app.get("/api/songs/play/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "❌ Song not found" });

    const filePath = path.resolve(__dirname, song.filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "❌ Error streaming song" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
