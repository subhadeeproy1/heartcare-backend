
// ==========================================
// 1. IMPORT REQUIRED PACKAGES
// ==========================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// ==========================================
// 2. IMPORT ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const geminiRoutes = require("./routes/geminiRoutes");

// ==========================================
// 3. INITIALIZE EXPRESS
// ==========================================

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 4. API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/gemini", geminiRoutes);

// ==========================================
// 5. TEST ROUTE
// ==========================================

app.post("/test", (req, res) => {
  res.json({
    message: "HeartCare backend test successful!"
  });
});

// ==========================================
// 6. HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send("HeartCare Backend is Running Successfully!");
});

// ==========================================
// 7. CONNECT MONGODB AND START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`HeartCare Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();
