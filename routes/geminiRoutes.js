
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.post("/assess", async (req, res) => {
  try {
    const {
      age,
      gender,
      bloodPressure,
      cholesterol,
      smoking,
      diabetes,
      familyHistory,
      physicalActivity,
      symptoms
    } = req.body;

    if (
      age === undefined ||
      !gender ||
      bloodPressure === undefined ||
      cholesterol === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide the required assessment information."
      });
    }

    const patientInformation = {
      age,
      gender,
      bloodPressure,
      cholesterol,
      smoking,
      diabetes,
      familyHistory,
      physicalActivity,
      symptoms
    };

    const prompt = `
You are an AI assistant for a heart-health awareness platform.

Analyse the following patient-provided information:
${JSON.stringify(patientInformation)}

Provide an educational heart-health assessment.

Include:
1. A brief summary of the provided information.
2. Potential heart-health risk factors.
3. Possible concerns that may need medical evaluation.
4. Practical next steps and lifestyle guidance.
5. Whether professional medical consultation is recommended.

Important rules:
- Do not diagnose heart disease.
- Do not claim that the patient has a specific disease.
- Do not invent missing medical information.
- Do not present this as a clinically validated prediction.
- Explain uncertainty clearly.
- If symptoms suggest an emergency, advise immediate emergency medical care.
- Keep the language simple and understandable.
`;

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: prompt
    });

    const assessment = response.output_text;

    if (!assessment) {
      throw new Error("Gemini returned an empty assessment.");
    }

    return res.status(200).json({
      success: true,
      assessment: assessment,
      disclaimer:
        "This is AI-generated educational information, not a medical diagnosis. Consult a qualified healthcare professional."
    });

  } catch (error) {
    console.error("Gemini assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate the assessment right now."
    });
  }
});

module.exports = router;
