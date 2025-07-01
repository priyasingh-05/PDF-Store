const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static PDFs

// ✅ MongoDB connection
mongoose.connect("mongodb://localhost:27017/pdfstore")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ Schemas
const Pdf = mongoose.model("Pdf", new mongoose.Schema({
  title: String,
  author: String,
  price: Number,
  filePath: String,
  category: String,       // ✅ new
  tags: [String]          // ✅ new
}));

const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String
}));


// ✅ Ensure uploads directory
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// ✅ Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ---------- Routes ---------- */

// ✅ Upload PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const { title, author, price, category, tags } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const newPdf = new Pdf({
  title,
  author,
  price: parseFloat(price),
  filePath: req.file.path.replace(/\\/g, "/"),
  category,
  tags: tags.split(",").map(t => t.trim()).filter(Boolean) // convert to array
});


    const saved = await newPdf.save();
    console.log("✅ PDF saved:", saved);

    res.status(201).json({ message: "PDF uploaded", pdf: saved });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: "Upload failed." });
  }
});


// ✅ Get all PDFs
app.get("/pdfs", async (req, res) => {
  const all = await Pdf.find();
  res.json(all);
});

// ✅ Download PDF by ID
app.get("/download/:id", async (req, res) => {
  const pdf = await Pdf.findById(req.params.id);
  if (!pdf) return res.status(404).send("PDF not found.");
  res.download(pdf.filePath);
});

// ✅ User Signup
app.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).send("All fields are required.");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).send("User already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, username, email, password: hashedPassword });
  await newUser.save();

  res.status(201).send("User registered successfully.");
});

// ✅ User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).send("Invalid credentials.");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).send("Invalid credentials.");

  res.json({
    name: user.name,
    username: user.username,
    email: user.email
  });
});

// ✅ Start Server (only once!)
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
