
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, ProvisionalDiagnosisResult, GeneratedQuestion, Medication, TestRecommendation, Prescription, PatientProfile, MetaSymptomQuestion, DoctorNoteSuggestion, DDxItem, DDxActionSuggestion } from '../types';
import { config } from '../config';

// This constant can be defined here or imported from a shared constants file if you create one for the backend
const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

const API_KEY = config.geminiApiKey;

if (!API_KEY) {
  // This warning is already in config/index.ts, but good to be defensive.
  console.error("CRITICAL ERROR: API_KEY for Gemini is not set. AI service will not function.");
}

// Initialize the GoogleGenAI client
// Ensure API_KEY is not undefined; the config check should ideally prevent this.
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const parseJsonFromText = <T,>(text: string, functionName: string): T | null => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?([\s\S]*?)\n?\s*```$/;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error(`Failed to parse JSON response in ${functionName}:`, e, "Original text:", text);
    return null;
  }
};

// Exported functions will be called by controllers

export const getInitialAssessmentAndQuestion = async (symptoms: string, chatHistory: ChatMessage[], patientProfile?: PatientProfile): Promise<GeneratedQuestion | null> => {
  if (!API_KEY) {
    console.error("getInitialAssessmentAndQuestion: API_KEY not available.");
    return null;
  }
  
  const historyContext = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
  let profileContext = "";
  if (patientProfile) {
    profileContext = "The patient has provided the following profile information:\n";
    if (patientProfile.name) profileContext += `- Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past Medical History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Lifestyle Habits: ${patientProfile.habits}\n`;
  }

  const prompt = `You are a highly empathetic and understanding medical assistant AI. Your goal is to help the patient clarify their symptoms gently and effectively for a healthcare professional.
Patient's initial symptoms: "${symptoms}"
${profileContext}
${chatHistory.length > 0 ? `Previous conversation context:\n${historyContext}` : ''}

Your tasks:
1.  Acknowledge the patient's input with warmth and understanding.
2.  Ask ONE clear, concise, and highly relevant follow-up question to gather more specific information. Use the patient's profile to make your question more personalized if appropriate. Frame questions positively (e.g., "Could you tell me a bit more about X?" instead of "Your description of X is unclear.").
3.  Optionally, if the patient's description is brief or could benefit from exploring related areas, provide 1-2 "metaSymptomQuestions". Each meta symptom question should have a "prompt" (the question for the patient) and an array of "options" (3-4 brief, clickable answer choices for the patient).
    Example: { "prompt": "Any associated fever?", "options": ["Yes, high fever", "Yes, mild fever", "No fever", "Unsure"] }
4.  Ensure your response is formatted as a JSON object. Example:
    {
      "question": "Thank you for sharing that. To understand better, could you tell me if the discomfort feels sharp or dull?",
      "metaSymptomQuestions": [
        { "prompt": "Regarding the headache, is it on one side or both?", "options": ["One side", "Both sides", "All over", "Not applicable"] },
        { "prompt": "Have you noticed any sensitivity to light?", "options": ["Yes, a lot", "Yes, a little", "No", "Not sure"] }
      ]
    }
    Or, if no meta questions are needed:
    {
      "question": "I understand. When did you first notice this symptom?"
    }
5.  Do NOT provide any diagnosis or medical advice yet. Only ask a question and optionally provide meta-symptom questions with options.
6.  If you feel you have enough information after 2-4 questions (considering the profile), make your main question and set "isFinal": true in the JSON. For example: {"question": "Thank you, that's very helpful. Just to confirm, have you experienced any nausea with this?", "isFinal": true }
Avoid phrases like "vague", "unclear", "nonspecific". Instead, gently guide the patient: "To help me understand a bit better, could you describe...".
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.5 } // Adjust temperature for more deterministic questions initially
    });
    return parseJsonFromText<GeneratedQuestion>(response.text || '', 'getInitialAssessmentAndQuestion');
  } catch (error) {
    console.error("Error getting initial assessment and question from Gemini:", error);
    // For an API, you might want to throw a custom error or return a structured error response
    return { question: "An error occurred while processing your request. Please try again." };
  }
};

export const getProvisionalDiagnosis = async (chatHistory: ChatMessage[], patientProfile?: PatientProfile): Promise<ProvisionalDiagnosisResult | null> => {
  if (!API_KEY) {
    console.error("getProvisionalDiagnosis: API_KEY not available.");
    return null;
  }
  const conversation = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
  let profileContext = "";
  if (patientProfile) {
    profileContext = "Patient Profile:\n";
    if (patientProfile.name) profileContext += `- Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past Medical History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Lifestyle Habits: ${patientProfile.habits}\n`;
  }

  const prompt = `You are an AI medical assistant. Based on the following conversation with a patient and their profile:
<conversation>
${conversation}
</conversation>
${profileContext}
Analyze the conversation and provide a provisional assessment.
Your response MUST be a JSON object with the following structure:
{
  "condition": "string | null (e.g., 'Symptoms align with possible Gastritis' or 'Observations suggest a common cold'. If unsure, use phrases like 'Symptoms are indicative of general discomfort, further investigation needed'. Set to null if truly insufficient information.)",
  "confidence": "string (e.g., 'low', 'medium', 'high', or 'insufficient information')",
  "summaryForPatient": "string (A brief, empathetic summary for the patient, e.g., 'Based on our conversation and what you've shared, it sounds like you're going through a tough time with X, Y, and Z. This could be related to [condition description, avoiding overly technical terms]. It's always best to consult with a doctor to get a clear understanding and the right care.')",
  "nextSteps": "string (e.g., 'I recommend scheduling a consultation with a clinic to discuss this further with a healthcare professional.')"
  // "potentialIcd10Codes": ["string"] (Optional: For EMR/HIS, suggest potential ICD-10 codes relevant to the condition)
  // "rationaleForSystem": "string" (Optional: For EMR/HIS, a more technical rationale for the provisional diagnosis)
}
Keep the language patient-friendly, empathetic, and reassuring for 'summaryForPatient'. Do NOT give definitive medical advice. Emphasize that this is provisional.
If the information is too limited, reflect that empathetically in the summary and set confidence to 'insufficient information'.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.6 }
    });
    const parsed = parseJsonFromText<ProvisionalDiagnosisResult>(response.text || '', 'getProvisionalDiagnosis');
    // You might add more robust error handling or default values here for an API
    return parsed;
  } catch (error) {
    console.error("Error getting provisional diagnosis from Gemini:", error);
    return { condition: "Error processing diagnosis", confidence: "error", summaryForPatient: "An error occurred while generating a provisional assessment.", nextSteps: "Please consult a healthcare professional directly." };
  }
};

// ... (Keep other functions: suggestTestsBasedOnCondition, refineDiagnosisWithTestResults, generateDoctorNotes, generatePrescriptionKeywords, generateDoctorNoteSuggestions, generateDifferentialDiagnoses, suggestActionsForDDx, generatePrescriptionWithEducation)
// Ensure all functions use parseJsonFromText with the function name for better error tracking.
// For brevity, I'm not repeating all of them here but they would be structured similarly.

// Example of adapting one more function:
export const generateDoctorNotes = async (symptoms: string, provisionalDiagnosis: string, patientProfile?: PatientProfile, testResultsSummary?: string | null): Promise<string | null> => {
  if (!API_KEY) {
    console.error("generateDoctorNotes: API_KEY not available.");
    return null;
  }
  let profileContext = "";
  if (patientProfile) {
    profileContext = "Patient Profile:\n";
    if (patientProfile.name) profileContext += `  - Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `  - Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `  - History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `  - Habits: ${patientProfile.habits}\n`;
  }

  const prompt = `Generate concise clinical notes for a doctor based on the following patient information:
Patient-reported symptoms: "${symptoms}"
Provisional diagnosis/concern: "${provisionalDiagnosis}"
${profileContext}
${testResultsSummary ? `Summary of test results: "${testResultsSummary}"` : ''}

Notes should be brief, structured for quick review (e.g., bullet points), highlighting key information, patient profile context, and potential areas for investigation/discussion.
Output as plain text. This output will be directly used by a system, so ensure it's clean and parsable if needed, or just well-formatted text.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      // config: { responseMimeType: "text/plain" } // if you want to be explicit
    });
    return response.text || null;
  } catch (error) {
    console.error("Error generating doctor notes from Gemini:", error);
    return "Error generating clinical notes.";
  }
};


export const generatePrescriptionWithEducation = async (provisionalDiagnosis: string, doctorSummaryForPrescription: string, doctorName?: string, clinicAddress?: string, clinicLicense?: string): Promise<Prescription | null> => {
  if (!API_KEY) {
    console.error("generatePrescriptionWithEducation: API_KEY not available.");
    return null;
  }
  const prompt = `A doctor is creating a prescription for a patient with a provisional diagnosis of "${provisionalDiagnosis}".
The doctor has provided a summary for the prescription, which may include specific medications, tests, and advice: "${doctorSummaryForPrescription}".

Based on this, generate a structured prescription.
Your response MUST be a JSON object with the following structure:
{
  "medications": [
    {
      "name": "string (e.g., Amoxicillin)",
      "dosage": "string (e.g., 250mg three times a day for 7 days)",
      "instructions": "string (e.g., Take with food. Complete the full course.)",
      "education": "string (Patient-friendly explanation of what the med is for, how it works simply, and common things to expect or watch for. Be reassuring.)",
      "adherenceTips": "string (1-2 practical tips for remembering to take it, e.g., Set a reminder on your phone. Take it with a specific meal.)"
    }
  ],
  "tests": [
    {
      "name": "string (e.g., Follow-up Blood Test)",
      "reason": "string (Why this test is recommended, in simple, reassuring terms)",
      "education": "string (What the patient can expect, any preparation, and why it's helpful)"
    }
  ],
  "generalAdvice": "string (Any general advice extracted or inferred from the doctor's summary, e.g., Ensure you get plenty of rest and stay hydrated. If your symptoms worsen or don't improve, please contact us.)",
  "doctorName": "${doctorName || 'Your Doctor'}",
  "clinicAddress": "${clinicAddress || 'Clinic Address'}",
  "clinicLicense": "${clinicLicense || 'License N/A'}",
  "issuedDate": "${new Date().toISOString()}" 
}

Extract medication names, dosages, and any mentioned tests explicitly from the doctor's summary. If the summary is broad, infer common advice.
If specific medications (e.g., "Amoxicillin 500mg TID for 7 days") or tests (e.g., "Order CBC") are clearly stated in the doctor's summary, prioritize these.
For education and adherence, provide concise, helpful, empathetic, and easy-to-understand information for the identified items.
Ensure the tone is supportive and educational.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonFromText<Prescription>(response.text || '', 'generatePrescriptionWithEducation');
  } catch (error) {    
    console.error("Error generating prescription with education from Gemini:", error);
    return null;
  }
};


// Add other AI service functions here (suggestTestsBasedOnCondition, refineDiagnosisWithTestResults, etc.)
// Remember to adapt them for backend use:
// - Check for API_KEY.
// - Use parseJsonFromText with the function name.
// - Handle errors appropriately for an API (e.g., return null, throw custom error, or return structured error response).

export const suggestTestsBasedOnCondition = async (provisionalCondition: string): Promise<string[] | null> => {
  if (!API_KEY) {
      console.error("suggestTestsBasedOnCondition: API_KEY not available.");
      return null;
  }
  const prompt = `A patient has a provisional condition of "${provisionalCondition}".
Suggest 1-2 common, non-invasive diagnostic tests (e.g., 'Complete Blood Count (CBC)', 'Urinalysis', 'Basic Metabolic Panel') that a primary care doctor might consider for such a condition to gather more information.
Phrase suggestions as a list for the patient to discuss with their doctor.
Your response MUST be a JSON array of strings: ["Test Name 1", "Test Name 2"].
If no specific tests are typically needed for a very mild/common condition or if it's too vague, return an empty array [].
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonFromText<string[]>(response.text || '', 'suggestTestsBasedOnCondition');
  } catch (error) {
    console.error("Error suggesting tests from Gemini:", error);
    return null;
  }
};

export const refineDiagnosisWithTestResults = async (provisionalDiagnosis: string, testResultsSummary: string, patientProfile?: PatientProfile): Promise<ProvisionalDiagnosisResult | null> => {
  if (!API_KEY) {
      console.error("refineDiagnosisWithTestResults: API_KEY not available.");
      return null;
  }
   let profileContext = "";
  if (patientProfile) {
    profileContext = "Patient Profile:\n";
    if (patientProfile.name) profileContext += `- Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past Medical History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Lifestyle Habits: ${patientProfile.habits}\n`;
  }
  const prompt = `A patient had a provisional diagnosis of "${provisionalDiagnosis}".
${profileContext}
They have now provided the following summary of their test results: "${testResultsSummary}".
Based on this new information, provide an updated or refined provisional assessment.
Your response MUST be a JSON object with the same structure as 'getProvisionalDiagnosis':
{
  "condition": "string | null",
  "confidence": "string",
  "summaryForPatient": "string (Empathetic summary, e.g., 'Thanks for sharing your test results. Considering these along with your symptoms, it seems we are leaning more towards [refined condition/confirmation]. Your doctor will be able to provide a definitive diagnosis.')",
  "nextSteps": "string (e.g., 'It's important to discuss these results and your symptoms thoroughly with your doctor during your appointment.')"
}
Emphasize this is still provisional and for discussion with their doctor. Maintain an empathetic tone.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
     return parseJsonFromText<ProvisionalDiagnosisResult>(response.text || '', 'refineDiagnosisWithTestResults');
  } catch (error) {
    console.error("Error refining diagnosis from Gemini:", error);
    return null;
  }
};

export const generatePrescriptionKeywords = async (provisionalDiagnosis: string, currentDoctorSummary: string): Promise<string[] | null> => {
  if (!API_KEY) {
    console.error("generatePrescriptionKeywords: API_KEY not available.");
    return null;
  }
  const prompt = `Based on a provisional diagnosis of "${provisionalDiagnosis}" and the doctor's current input for prescription summary: "${currentDoctorSummary}", suggest 3-5 common keywords or short phrases (e.g., "hydration", "pain relief", "antibiotic course", "follow-up in 1 week", "monitor symptoms", "refer to specialist") that a doctor might use to complete their prescription notes or advice.
Exclude keywords already substantially present in the currentDoctorSummary.
Prioritize actionable and common terms.
Return as a JSON array of strings. Example: ["rest", "increase fluid intake", "OTC painkiller PRN"].
If the diagnosis is very generic (e.g., "General Discomfort") or the summary is already comprehensive, provide general wellness terms or an empty array.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonFromText<string[]>(response.text || '', 'generatePrescriptionKeywords');
  } catch (error) {
    console.error("Error generating prescription keywords from Gemini:", error);
    return [];
  }
};

export const generateDoctorNoteSuggestions = async (currentNote: string, provisionalDiagnosis: string, patientProfile?: PatientProfile): Promise<DoctorNoteSuggestion[] | null> => {
  if (!API_KEY) {
    console.error("generateDoctorNoteSuggestions: API_KEY not available.");
    return null;
  }
  let profileContext = "";
  if (patientProfile) {
    profileContext = "Patient Profile context:\n";
    if (patientProfile.name) profileContext += `- Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- History: ${patientProfile.pastHistory}\n`;
  }

  const prompt = `A doctor is writing notes for a patient.
Provisional Diagnosis from AI: "${provisionalDiagnosis}"
${profileContext}
Doctor's current partial note: "${currentNote}"

Suggest 2-4 brief, highly relevant "DoctorNoteSuggestion" items to help complete the note. These can be:
1.  'autocomplete' type: Common medical phrases or terms that logically follow or complete the current note, fitting the provisional diagnosis.
2.  'meta-finding' type: Related symptoms, observations, or common associations with the provisional diagnosis that the doctor might not have mentioned yet but are important to consider or document.

Focus on clinical relevance and brevity. Avoid redundancy with the current note.
Return as a JSON array of objects: [{ "suggestion": "text", "type": "autocomplete" | "meta-finding" }, ...].
The model should always attempt to provide suggestions, even if general. Client-side logic can filter if needed.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonFromText<DoctorNoteSuggestion[]>(response.text || '', 'generateDoctorNoteSuggestions');
  } catch (error) {
    console.error("Error generating doctor note suggestions from Gemini:", error);
    return [];
  }
};

export const generateDifferentialDiagnoses = async (patientSymptoms: string, provisionalDiagnosis: string, doctorInitialNotes: string, patientProfile?: PatientProfile): Promise<DDxItem[] | null> => {
  if (!API_KEY) {
    console.error("generateDifferentialDiagnoses: API_KEY not available.");
    return null;
  }
  let profileContext = "";
  if (patientProfile) {
    profileContext = "Patient Profile:\n";
    if (patientProfile.name) profileContext += `- Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Habits: ${patientProfile.habits}\n`;
  }

  const prompt = `Based on the following patient information:
Patient-reported Symptoms: "${patientSymptoms}"
Initial AI Provisional Diagnosis: "${provisionalDiagnosis}"
Doctor's Initial Notes: "${doctorInitialNotes}"
${profileContext}

Generate 2-3 plausible differential diagnoses (DDx). For each DDx, provide a brief rationale.
Your response MUST be a JSON array of DDxItem objects:
[
  { "condition": "string (Name of DDx)", "rationale": "string (Brief explanation why this is a consideration)" },
  ...
]
Focus on common conditions first, considering all provided information. Keep rationale concise.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonFromText<DDxItem[]>(response.text || '', 'generateDifferentialDiagnoses');
  } catch (error) {
    console.error("Error generating differential diagnoses from Gemini:", error);
    return null;
  }
};

export const suggestActionsForDDx = async (selectedDDx: string, patientProfile?: PatientProfile): Promise<DDxActionSuggestion | null> => {
  if (!API_KEY) {
    console.error("suggestActionsForDDx: API_KEY not available.");
    return null;
  }
  let profileContext = "";
  if (patientProfile) {
    profileContext = "Relevant Patient Profile context for treatment/test considerations:\n";
    if (patientProfile.name) profileContext += `- Name: ${patientProfile.name}\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past History: ${patientProfile.pastHistory} (especially allergies, chronic conditions)\n`;
  }

  const prompt = `A doctor has selected "${selectedDDx}" as a working differential diagnosis.
${profileContext}
Suggest potential actions:
1.  \`suggestedMedications\`: 1-2 common first-line medications for this condition. Include name, typical dosage, and brief typical instructions.
2.  \`suggestedTests\`: 1-2 common diagnostic tests to confirm or further investigate this DDx. Include name and a brief reason.

Your response MUST be a JSON object of type DDxActionSuggestion:
{
  "suggestedMedications": [
    { "name": "string", "typicalDosage": "string", "typicalInstructions": "string" }
  ],
  "suggestedTests": [
    { "name": "string", "reason": "string" }
  ]
}
If the DDx is very general (e.g., "Viral Syndrome"), suggest symptomatic relief and conservative tests.
Provide empty arrays if no specific meds/tests are standard for a very mild or self-limiting condition beyond general advice.
Prioritize common, evidence-based suggestions.
`;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonFromText<DDxActionSuggestion>(response.text || '', 'suggestActionsForDDx');
  } catch (error) {
    console.error("Error suggesting actions for DDx from Gemini:", error);
    return { suggestedMedications: [], suggestedTests: [] };
  }
};

// Enhanced AI Assistant Functions

export const generateContextualAutocomplete = async (
  currentText: string,
  currentWord: string,
  provisionalDiagnosis: string,
  patientProfile?: PatientProfile
): Promise<string[] | null> => {
  if (!API_KEY) {
    console.error("generateContextualAutocomplete: API_KEY not available.");
    return null;
  }

  let profileContext = "";
  if (patientProfile) {
    profileContext = `Patient context: Age ${patientProfile.age || 'N/A'}, `;
    if (patientProfile.pastHistory) profileContext += `History: ${patientProfile.pastHistory}`;
  }

  const prompt = `You are providing contextual autocomplete for a doctor writing clinical notes.

Current context:
- Provisional diagnosis: "${provisionalDiagnosis}"
- ${profileContext}
- Current text: "${currentText}"
- Current word being typed: "${currentWord}"

Provide 3-5 relevant autocomplete suggestions that could complete the current word or phrase. Focus on:
1. Medical terminology related to the diagnosis
2. Common clinical phrases and abbreviations
3. Medication names and dosages
4. Examination findings
5. Treatment plans

Return as a JSON array of strings. Each suggestion should be a complete word or short phrase that could replace or complete the current word.

Example: ["headache", "hypertension", "ibuprofen 400mg", "follow-up in 2 weeks", "vital signs stable"]`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 }
    });
    return parseJsonFromText<string[]>(response.text || '', 'generateContextualAutocomplete');
  } catch (error) {
    console.error("Error generating contextual autocomplete from Gemini:", error);
    return [];
  }
};

export const generateSmartSuggestions = async (
  currentText: string,
  provisionalDiagnosis: string,
  patientProfile?: PatientProfile,
  selectedDDx?: string
): Promise<string[] | null> => {
  if (!API_KEY) {
    console.error("generateSmartSuggestions: API_KEY not available.");
    return null;
  }

  let profileContext = "";
  if (patientProfile) {
    profileContext = `Patient Profile:\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past History: ${patientProfile.pastHistory}\n`;
  }

  const workingDiagnosis = selectedDDx || provisionalDiagnosis;

  const prompt = `You are providing smart clinical suggestions for a doctor writing notes.

Current context:
- Working diagnosis: "${workingDiagnosis}"
- ${profileContext}
- Current notes: "${currentText}"

Based on the current notes and diagnosis, suggest 4-6 relevant clinical findings, observations, or next steps that the doctor might want to add. Focus on:

1. Common examination findings for this condition
2. Relevant vital signs or measurements
3. Associated symptoms to document
4. Treatment considerations
5. Follow-up recommendations
6. Patient education points

Return as a JSON array of strings. Each suggestion should be a complete, actionable phrase that can be directly added to the notes.

Example: ["Blood pressure 120/80", "No lymphadenopathy noted", "Patient counseled on medication adherence", "RTC in 1 week if symptoms persist"]`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.4 }
    });
    return parseJsonFromText<string[]>(response.text || '', 'generateSmartSuggestions');
  } catch (error) {
    console.error("Error generating smart suggestions from Gemini:", error);
    return [];
  }
};

export const summarizeNotesToStructured = async (
  rawNotes: string,
  provisionalDiagnosis: string,
  patientProfile?: PatientProfile
): Promise<{
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExamination: string;
  assessment: string;
} | null> => {
  if (!API_KEY) {
    console.error("summarizeNotesToStructured: API_KEY not available.");
    return null;
  }

  let profileContext = "";
  if (patientProfile) {
    profileContext = `Patient Profile:\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past History: ${patientProfile.pastHistory}\n`;
  }

  const prompt = `You are organizing clinical notes into a structured format.

Input:
- Provisional diagnosis: "${provisionalDiagnosis}"
- ${profileContext}
- Raw clinical notes: "${rawNotes}"

Organize the information into the standard SOAP note format sections. Extract and categorize information from the raw notes appropriately.

Return as a JSON object with this exact structure:
{
  "chiefComplaint": "string (Main reason for visit, primary symptom or concern)",
  "historyOfPresentIllness": "string (Timeline, symptom progression, associated factors, what makes it better/worse)",
  "physicalExamination": "string (Examination findings, vital signs, physical observations)",
  "assessment": "string (Clinical impression, working diagnosis, differential considerations, plan)"
}

If information is missing for any section, provide a reasonable clinical summary based on available information and the provisional diagnosis. Keep each section concise but comprehensive.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 }
    });
    return parseJsonFromText<{
      chiefComplaint: string;
      historyOfPresentIllness: string;
      physicalExamination: string;
      assessment: string;
    }>(response.text || '', 'summarizeNotesToStructured');
  } catch (error) {
    console.error("Error summarizing notes to structured format from Gemini:", error);
    return null;
  }
};

// Phase 4: Specialty-Aware AI Functions

export const generateSpecialtyAwareProvisionalDiagnosis = async (
  symptoms: string,
  chatHistory: any[],
  patientProfile?: PatientProfile,
  clinicSpecialty?: string
): Promise<ProvisionalDiagnosisResult | null> => {
  if (!API_KEY) {
    console.error("generateSpecialtyAwareProvisionalDiagnosis: API_KEY not available.");
    return null;
  }

  let profileContext = "";
  if (patientProfile) {
    profileContext = `Patient Profile:\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past Medical History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Habits: ${patientProfile.habits}\n`;
  }

  let specialtyContext = "";
  if (clinicSpecialty && clinicSpecialty !== 'General Practice') {
    specialtyContext = `\nCLINIC SPECIALTY CONTEXT: This consultation is taking place in a ${clinicSpecialty} specialty clinic.
    Please provide diagnosis suggestions that are:
    1. More specialized and detailed for ${clinicSpecialty} conditions
    2. Appropriate for the level of expertise expected in a ${clinicSpecialty} practice
    3. Include specialty-specific differential diagnoses
    4. Consider advanced ${clinicSpecialty} treatment options`;
  }

  const chatContext = chatHistory.length > 0
    ? `\nPrevious conversation:\n${chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n')}`
    : '';

  const prompt = `You are an AI medical assistant providing provisional diagnosis for a ${clinicSpecialty || 'General Practice'} clinic.

${profileContext}
Current symptoms: "${symptoms}"
${chatContext}
${specialtyContext}

Provide a provisional diagnosis with appropriate confidence level and next steps. Consider the clinic specialty when making recommendations.

Return as JSON:
{
  "condition": "string (most likely diagnosis)",
  "confidence": "string (High/Medium/Low with brief reasoning)",
  "summaryForPatient": "string (patient-friendly explanation)",
  "nextSteps": "string (recommended next steps appropriate for this specialty)"
}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.4 }
    });
    return parseJsonFromText<ProvisionalDiagnosisResult>(response.text || '', 'generateSpecialtyAwareProvisionalDiagnosis');
  } catch (error) {
    console.error("Error generating specialty-aware provisional diagnosis from Gemini:", error);
    return null;
  }
};

// Phase 5: Advanced Prescription Generation with Safety Features

export const checkDrugInteractions = async (
  medications: string[],
  patientProfile?: PatientProfile,
  currentMedications?: string[]
): Promise<{
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    recommendation: string;
    alternatives?: string[];
  }>;
  allergies: string[];
  contraindications: string[];
  dosageAlerts: string[];
  monitoringRequirements: string[];
} | null> => {
  if (!API_KEY) {
    console.error("checkDrugInteractions: API_KEY not available.");
    return null;
  }

  let profileContext = "";
  if (patientProfile) {
    profileContext = `Patient Profile:\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past Medical History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Habits: ${patientProfile.habits}\n`;
  }

  const currentMedsContext = currentMedications && currentMedications.length > 0
    ? `\nCurrent Medications: ${currentMedications.join(', ')}`
    : '';

  const prompt = `You are a clinical pharmacist AI performing comprehensive drug interaction and safety checking.

${profileContext}
New Medications to Prescribe: ${medications.join(', ')}
${currentMedsContext}

Perform a comprehensive safety analysis including:
1. Drug-drug interactions (between new medications and with current medications)
2. Age-related contraindications and dosing concerns
3. Medical history contraindications
4. Allergy considerations
5. Monitoring requirements

Return as JSON:
{
  "interactions": [
    {
      "drug1": "string",
      "drug2": "string",
      "severity": "minor|moderate|major|contraindicated",
      "description": "string (detailed explanation)",
      "recommendation": "string (what to do)",
      "alternatives": ["string"] (optional alternative medications)
    }
  ],
  "allergies": ["string"] (potential allergy concerns),
  "contraindications": ["string"] (medical history contraindications),
  "dosageAlerts": ["string"] (age/weight/organ function adjustments needed),
  "monitoringRequirements": ["string"] (lab tests, vital signs to monitor)
}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.2 }
    });
    return parseJsonFromText<{
      interactions: Array<{
        drug1: string;
        drug2: string;
        severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
        description: string;
        recommendation: string;
        alternatives?: string[];
      }>;
      allergies: string[];
      contraindications: string[];
      dosageAlerts: string[];
      monitoringRequirements: string[];
    }>(response.text || '', 'checkDrugInteractions');
  } catch (error) {
    console.error("Error checking drug interactions from Gemini:", error);
    return null;
  }
};

// Phase 6: Automated Clinical Decision Support

export const generateAutomatedTreatmentPlan = async (
  confirmedDiagnosis: string,
  clinicSpecialty: string,
  patientProfile?: PatientProfile,
  clinicalNotes?: string
): Promise<{
  diagnosis: string;
  specialty: string;
  protocol: {
    condition: string;
    specialty: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
      ageAdjusted?: boolean;
      weightBased?: boolean;
      renalAdjustment?: boolean;
      hepaticAdjustment?: boolean;
      contraindications?: string[];
      sideEffects?: string[];
      patientEducation?: string[];
    }>;
    diagnosticTests: string[];
    monitoringSchedule: string[];
    patientEducation: string[];
    followUpRecommendations: string[];
  };
  customizations: string[];
  doctorApprovalRequired: boolean;
} | null> => {
  if (!API_KEY) {
    console.error("generateAutomatedTreatmentPlan: API_KEY not available.");
    return null;
  }

  let profileContext = "";
  if (patientProfile) {
    profileContext = `Patient Profile:\n`;
    if (patientProfile.age) profileContext += `- Age: ${patientProfile.age}\n`;
    if (patientProfile.pastHistory) profileContext += `- Past Medical History: ${patientProfile.pastHistory}\n`;
    if (patientProfile.habits) profileContext += `- Habits: ${patientProfile.habits}\n`;
  }

  const notesContext = clinicalNotes ? `\nClinical Notes: ${clinicalNotes}` : '';

  const prompt = `You are an AI clinical decision support system generating evidence-based treatment protocols.

${profileContext}
Confirmed Diagnosis: ${confirmedDiagnosis}
Clinic Specialty: ${clinicSpecialty}
${notesContext}

Generate a comprehensive, evidence-based treatment plan appropriate for a ${clinicSpecialty} practice. Include:

1. First-line medications with proper dosing for this patient's age/profile
2. Essential diagnostic tests and monitoring
3. Patient education specific to this condition
4. Follow-up schedule and recommendations
5. Specialty-specific considerations

Return as JSON:
{
  "diagnosis": "${confirmedDiagnosis}",
  "specialty": "${clinicSpecialty}",
  "protocol": {
    "condition": "${confirmedDiagnosis}",
    "specialty": "${clinicSpecialty}",
    "medications": [
      {
        "name": "string",
        "dosage": "string (specific dose)",
        "frequency": "string (how often)",
        "duration": "string (how long)",
        "instructions": "string (patient-friendly instructions)",
        "ageAdjusted": boolean,
        "weightBased": boolean,
        "renalAdjustment": boolean,
        "hepaticAdjustment": boolean,
        "contraindications": ["string"],
        "sideEffects": ["string"],
        "patientEducation": ["string"]
      }
    ],
    "diagnosticTests": ["string"],
    "monitoringSchedule": ["string"],
    "patientEducation": ["string"],
    "followUpRecommendations": ["string"]
  },
  "customizations": ["string (any patient-specific modifications)"],
  "doctorApprovalRequired": true
}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 }
    });
    return parseJsonFromText<{
      diagnosis: string;
      specialty: string;
      protocol: {
        condition: string;
        specialty: string;
        medications: Array<{
          name: string;
          dosage: string;
          frequency: string;
          duration: string;
          instructions: string;
          ageAdjusted?: boolean;
          weightBased?: boolean;
          renalAdjustment?: boolean;
          hepaticAdjustment?: boolean;
          contraindications?: string[];
          sideEffects?: string[];
          patientEducation?: string[];
        }>;
        diagnosticTests: string[];
        monitoringSchedule: string[];
        patientEducation: string[];
        followUpRecommendations: string[];
      };
      customizations: string[];
      doctorApprovalRequired: boolean;
    }>(response.text || '', 'generateAutomatedTreatmentPlan');
  } catch (error) {
    console.error("Error generating automated treatment plan from Gemini:", error);
    return null;
  }
};
