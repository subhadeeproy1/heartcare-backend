const express = require("express");
const bcrypt = require("bcryptjs");
const Patient = require("../models/Patient");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields."
      });
    }

    const existingPatient = await Patient.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingPatient) {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const patient = new Patient({
      name,
      email: email.toLowerCase().trim(),
      phone,
      passwordHash: hashedPassword
    });

    await patient.save();

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
    console.error("Registration Error:", error.message);

    return res.status(500).json({
      message: "Registration failed."
    });
  }
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({
      email: email.toLowerCase()
    }).select("+passwordHash");

    if (!patient) {
      return res.status(400).json({
        message: "Invalid email or password."
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      patient.passwordHash
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      { id: patient._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
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
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login."
    });
  }
});



// GET LOGGED-IN PATIENT PROFILE
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const patient = await Patient.findById(
      decoded.patientId || decoded.id
    );

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found."
      });
    }

    return res.status(200).json({
      message: "Patient profile retrieved successfully!",
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
      message: "Invalid or expired token."
    });
  }
});


module.exports = router;
