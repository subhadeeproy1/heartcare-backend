
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

// ==========================================
// 1. GEMINI CONFIGURATION
// ==========================================

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

// ==========================================
// 2. HELPER FUNCTION
// ==========================================

function getValue(value, fallback = "Not provided") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : fallback;
  }

  return String(value).trim().slice(0, 300);
}

// ==========================================
// 3. HEART HEALTH ASSESSMENT
// ==========================================

router.post("/assess", async (req, res) => {
  const startTime = Date.now();

  try {
    // Check API key
    if (!ai) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing. Check your backend .env file."
      });
    }

    // Get patient information
    const {
      age,
      gender,
      symptoms,
      otherSymptoms,
      symptomDuration,
      symptomSeverity,
      symptomFrequency,
      bloodPressure,
      cholesterol,
      smoking,
      diabetes,
      familyHistory,
      physicalActivity
    } = req.body || {};

    // Prepare patient information
    const patientInformation = `
PATIENT HEALTH INFORMATION

Age: ${getValue(age)}
Gender: ${getValue(gender)}

Reported Symptoms: ${getValue(symptoms)}
Additional Symptoms: ${getValue(otherSymptoms)}

Symptom Duration: ${getValue(symptomDuration)}
Symptom Severity: ${getValue(symptomSeverity)}
Symptom Frequency: ${getValue(symptomFrequency)}

Blood Pressure: ${getValue(bloodPressure)}
Total Cholesterol: ${getValue(cholesterol)}

Smoking: ${getValue(smoking)}
Diabetes: ${getValue(diabetes)}
Family History of Heart Disease: ${getValue(familyHistory)}
Physical Activity: ${getValue(physicalActivity)}
`;

    // ==========================================
    // 4. SHORT AND FOCUSED AI PROMPT
    // ==========================================

    const prompt = `
You are HeartCare, an AI-powered heart health awareness assistant.

Review the following patient-provided information and produce a
concise, easy-to-understand educational report.

${patientInformation}

IMPORTANT INSTRUCTIONS:

1. Do not diagnose any heart disease.
2. Do not invent disease probabilities or risk percentages.
3. Do not claim that the patient definitely has or does not have
   a particular heart condition.
4. Explain relevant reported symptoms and health factors.
5. Clearly identify information that was not provided.
6. Give practical, general heart-health recommendations.
7. Recommend consultation with a qualified healthcare professional.
8. If chest pain, severe breathing difficulty, fainting or other
   potentially serious symptoms are reported, clearly advise urgent
   medical evaluation. If symptoms are happening now, tell the
   patient not to wait for this report and to seek emergency care.
9. Do not delay emergency advice until the end of the report.
10. Keep the report concise, approximately 150-200 words.

USE THESE REPORT SECTIONS:

1. Heart Health Overview
2. Reported Symptoms
3. Relevant Health Factors
4. Recommendations
5. Medical Advice

Use simple English and short paragraphs.
Avoid unnecessary repetition.
Do not use Markdown bold formatting.
`;

    // ==========================================
    // 5. GENERATE GEMINI RESPONSE
    // ==========================================

    console.log("Starting Gemini heart assessment...");

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",

      input: prompt,

      generation_config: {
        thinking_level: "low"
      }
    });

    // Get generated report
    const assessment = response.output_text
      ? response.output_text.trim()
      : "";

    // Check response
    if (!assessment) {
      console.error("Gemini returned an empty assessment.");

      return res.status(502).json({
        success: false,
        message: "Gemini could not generate an assessment. Please try again."
      });
    }

    // ==========================================
    // 6. CALCULATE RESPONSE TIME
    // ==========================================

    const endTime = Date.now();

    const responseTime = (
      (endTime - startTime) / 1000
    ).toFixed(2);

    console.log(
      `Gemini assessment completed in ${responseTime} seconds.`
    );

    // ==========================================
    // 7. SEND RESULT TO FRONTEND
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Heart health assessment generated successfully.",

      assessment: assessment,
      aiAssessment: assessment,

      responseTime: `${responseTime} seconds`,

      disclaimer:
        "This AI-generated report is for educational purposes only. It is not a medical diagnosis. Consult a qualified healthcare professional.",

      aiDisclaimer:
        "This AI-generated report is for educational purposes only. It is not a medical diagnosis. Consult a qualified healthcare professional."
    });

  } catch (error) {
    const endTime = Date.now();

    const responseTime = (
      (endTime - startTime) / 1000
    ).toFixed(2);

    console.error("Gemini assessment error:", error);

    console.log(
      `Failed Gemini request after ${responseTime} seconds.`
    );

    return res.status(500).json({
      success: false,
      message: "Unable to generate the assessment. Please try again."
    });
  }
});

// ==========================================
// 8. EXPORT ROUTER
// ==========================================

module.exports = router;
