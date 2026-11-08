
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");

const router = express.Router();

// ==========================================
// 1. PATIENT REGISTRATION
// POST /api/auth/register
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields."
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether patient already exists
    const existingPatient = await Patient.findOne({
      email: normalizedEmail
    });

    if (existingPatient) {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    // Hash password before saving
    const passwordHash = await bcrypt.hash(password, 10);

    // Create patient
    const patient = await Patient.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash
    });

    return res.status(201).json({
      message: "Patient registered successfully!",
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      message: "Server error during registration."
    });
  }
});


// ==========================================
// 2. PATIENT LOGIN
// POST /api/auth/login
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    // Find patient by email
    const patient = await Patient.findOne({
      email: email.trim().toLowerCase()
    }).select("+passwordHash");

    if (!patient) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      patient.passwordHash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Check JWT secret configuration
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // Generate authentication token
    const token = jwt.sign(
      {
        patientId: patient._id.toString()
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Server error during login."
    });
  }
});


// ==========================================
// 3. GET LOGGED-IN PATIENT PROFILE
// GET /api/auth/me
// ==========================================

router.get("/me", async (req, res) => {
  try {
    // Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find patient using token's patientId
    const patient = await Patient.findById(decoded.patientId);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    return res.status(200).json({
      message: "Patient profile retrieved successfully.",
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });

  } catch (error) {
    console.error("Profile Error:", error.message);

    return res.status(401).json({
      message: "Your session is invalid or expired. Please login again."
    });
  }
});


module.exports = router;
