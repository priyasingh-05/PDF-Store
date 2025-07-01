const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  title: String,
  author: String,
  price: Number,
  filePath: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PDF", pdfSchema);
