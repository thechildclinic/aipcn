
# Primary Care AI Assistant Suite

## Project Overview

The Primary Care AI Assistant Suite is a comprehensive platform designed to assist patients through their healthcare journey and provide tools for healthcare providers and entities. It leverages Google's Gemini AI for various intelligent features. The suite currently consists of two main parts:

1.  **AI Primary Care Assistant (Frontend):** A patient-facing React application that helps users:
    *   Input symptoms via text or voice (simulated).
    *   Engage in an AI-driven chat to clarify symptoms.
    *   Receive a provisional AI-generated assessment.
    *   Find and select clinics.
    *   Book appointments (simulated).
    *   View a simulated doctor's console with AI-generated notes, differential diagnosis suggestions, and prescription aids.
    *   Access pharmacy and lab order views.
    *   Maintain a local history of interactions and a patient profile.
2.  **Marketplace Onboarding (Frontend):** A section for clinics, labs, and pharmacies to (simulatively) onboard themselves onto the platform.
3.  **Backend API (Node.js/Express):** A server-side application intended to:
    *   Securely handle all interactions with the Google Gemini API.
    *   Provide API endpoints for all AI functionalities.
    *   (Future) Manage persistent data (patient profiles, appointments, provider information) in a database.
    *   (Future) Handle authentication and authorization.

This project demonstrates a rich set of AI-driven healthcare interactions and provides a foundation for a more extensive platform.

## Features

### 1. Patient Flow (AI Primary Care Assistant)
    - **Welcome & Profile:** Option to create/load a patient profile (name, age, history, habits) stored in browser's local storage.
    - **Symptom Input:**
        - Initial symptom description (text).
        - Simulated voice input.
        - AI-driven chat with leading questions and clickable meta-symptom suggestions to refine information.
    - **Provisional Diagnosis:** AI generates a provisional condition, confidence level, and patient-friendly summary.
    - **Clinic Selection:** Displays a list of mock clinics, filterable and sortable, based on the provisional diagnosis.
    - **Appointment Booking:**
        - Select date and time.
        - Option to upload (simulated) test reports, which can refine the provisional diagnosis.
        - AI suggests pre-consultation tests.
    - **Interaction History:** View past interactions (symptoms, diagnosis, clinic) stored locally.

### 2. Doctor/Clinical View (Part of Patient Flow)
    - **Consultation Hub:** Simulates a doctor's view for a booked appointment.
    - **Patient Information:** Displays patient profile, initial AI assessment, and uploaded reports.
    - **AI Pre-Consultation Notes:** Automatically generated notes for the doctor based on patient data.
    - **Dynamic AI Assistant Panel:**
        - **Note Completion & Keywords:** As the doctor types notes, AI suggests auto-completions and relevant keywords.
        - **Automatic Differential Diagnosis (DDx):** AI proactively suggests DDx based on doctor's notes and patient info.
        - **DDx Actions:** When a DDx is selected, AI suggests relevant tests and medications.
    - **Prescription Generation:**
        - Doctor writes a summary/plan, augmented by AI suggestions.
        - AI generates a structured prescription including medications (with dosage, instructions, education, adherence tips) and tests (with reason, education).
        - Tabbed view for "Formal Prescription" and "Patient Education".
    - **Order Views:**
        - **Pharmacy Order View:** Formatted view of medications for a pharmacist.
        - **Lab Order View:** Formatted view of tests for a lab.

### 3. Marketplace Onboarding Flow (Frontend Simulation)
    - **Welcome:** Portal for Clinics, Labs, and Pharmacies to join.
    - **Business Type Selection.**
    - **Onboarding Form:** Collects business details, contact information, service specifics, and simulated regulatory compliance attestations.
    - **Confirmation:** Simulated submission confirmation.

### 4. Backend API Features
    - **AI Abstraction:** All calls to Google Gemini are routed through the backend.
    - **Symptom Analysis Endpoints:**
        - Initial assessment and question generation.
        - Provisional diagnosis generation.
    - **Doctor Assist Endpoints:**
        - Doctor note generation.
        - Prescription generation with educational content.
        - (Endpoints for keywords, DDx, etc., are planned).
    - **Usage Tracking (In-Memory):** Basic counter for AI API calls.
    - **AI Provider Flexibility (Conceptual):** Designed to potentially switch between different LLM providers in the future.

## Technology Stack

**Frontend (AI Primary Care Assistant & Marketplace Onboarding):**
    - React 19 (using `esm.sh` for module resolution)
    - TypeScript
    - Tailwind CSS (via CDN)
    - `@google/genai` (for client-side interaction in current demo, **to be fully moved to backend**)

**Backend (API Server):**
    - Node.js
    - Express.js
    - TypeScript
    - `@google/genai` (for server-side AI calls)
    - `cors`, `dotenv`

## Project Structure

```
.
├── backend/                  # Node.js/Express API
│   ├── dist/                 # Compiled JavaScript (after build)
│   ├── src/                  # Backend TypeScript source
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic (AI, DB, etc.)
│   │   ├── config/           # Environment config
│   │   ├── interfaces/       # Abstraction interfaces (e.g., IAssistantAIProvider)
│   │   └── types.ts          # Backend-specific types
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md             # Backend specific README
├── components/               # Frontend React components
├── services/                 # Frontend services (AI, clinic, localStorage)
├── App.tsx                   # Main frontend application component
├── constants.tsx             # Frontend constants (icons, model names)
├── index.html                # Main HTML entry point
├── index.tsx                 # Frontend React entry point
├── metadata.json             # Application metadata (permissions)
├── types.ts                  # Frontend shared TypeScript types
└── README.md                 # This file
```

## Setup and Installation

### Prerequisites
*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Google Gemini API Key (`API_KEY`)

### 1. Frontend Application

The frontend application is designed to run directly in a browser that supports ES Modules and `importmap`.

1.  **No explicit build step is *required* for the current demo setup.**
2.  Ensure your Google Gemini `API_KEY` is set as an environment variable where you intend to serve or access these files if you keep the `geminiService.ts` on the frontend (e.g., via a `.env` file if using a local dev server that supports it, or directly in the environment if deploying as static files where this key might be exposed - **NOT RECOMMENDED FOR PRODUCTION**).
    *   **IMPORTANT SECURITY NOTE:** For production, the `geminiService.ts` logic using the `API_KEY` **must be moved entirely to the backend**. The frontend should make API calls to your backend, which then securely calls the Gemini API.

### 2. Backend API Server

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up environment variables:**
    *   Create a `.env` file in the `backend` directory by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Google Gemini `API_KEY`.
    *   (Optional) Configure `PORT` (default is `3001`).
    *   (Optional) Configure `AI_PROVIDER` (default is `gemini`).

## Running the Application

### 1. Frontend
    - Serve the `index.html` and associated `.tsx` / `.ts` files using a simple HTTP server. For example, using `npx serve`:
      ```bash
      npx serve .
      ```
    - Open your browser to the provided URL (e.g., `http://localhost:3000`).
    - **Note on API Key for Frontend Demo:** The frontend `services/geminiService.ts` currently tries to read `process.env.API_KEY`. For the client-side demo to work *as is*, this key would need to be made available to the browser's JavaScript context, which is highly insecure and **not for production**. One way to simulate this for local dev (still insecure) is to hardcode it temporarily for testing or use a dev server that can inject it. **The correct production approach is to have the frontend call the backend API.**

### 2. Backend API
1.  **Development Mode (with hot-reloading):**
    ```bash
    cd backend
    npm run dev
    ```
    The server will start on `http://localhost:3001` (or the port specified in your `.env`).

2.  **Production Mode:**
    First, build the TypeScript code:
    ```bash
    cd backend
    npm run build
    ```
    Then, start the server:
    ```bash
    npm start
    ```

## Environment Variables

### Frontend
*   `API_KEY`: (Currently used by frontend `geminiService.ts` - **SECURITY RISK - MOVE TO BACKEND**) Your Google Gemini API Key.

### Backend (`backend/.env`)
*   `API_KEY`: (Required) Your Google Gemini API Key.
*   `PORT`: (Optional) Port for the backend server (default: `3001`).
*   `AI_PROVIDER`: (Optional) Specifies the AI provider to use (default: `gemini`). Primarily for future flexibility.
*   `LOG_LEVEL`: (Optional) Logging level, e.g., `info`, `debug` (default: `info`).
*   `DATABASE_URL`: (Future) Connection string for your database.

## Backend API Endpoints (Current & Planned)

The backend API is designed to serve all AI-driven functionalities.

*   `POST /api/symptom-checker/initial-assessment`: Initiates symptom check.
    *   Request: `{ symptoms: string, chatHistory?: ChatMessage[], patientProfile?: PatientProfile }`
    *   Response: `GeneratedQuestion`
*   `POST /api/symptom-checker/provisional-diagnosis`: Gets provisional diagnosis.
    *   Request: `{ chatHistory: ChatMessage[], patientProfile?: PatientProfile }`
    *   Response: `ProvisionalDiagnosisResult`
*   `POST /api/symptom-checker/doctor-notes`: Generates notes for a doctor.
    *   Request: `GenerateDoctorNotesRequest`
    *   Response: `string` (notes)
*   `POST /api/prescription/generate-full`: Generates a prescription with education.
    *   Request: `GeneratePrescriptionRequest`
    *   Response: `Prescription`
*   `GET /api/usage-stats`: Retrieves in-memory API usage counts.
*   *(More endpoints planned for other AI features like DDx, note suggestions, etc.)*

## Deployment Readiness & Path to Production

This project is a feature-rich prototype. For production deployment, the following are critical:

### Immediate Priorities:
1.  **Security - API Key Handling:**
    *   **Refactor Frontend:** Remove all direct Gemini API calls and `API_KEY` usage from the frontend.
    *   **Modify Frontend:** All AI-related requests from the frontend must go to *your backend API endpoints*.
    *   **Backend Responsibility:** The backend API will be the *only* component that uses the Gemini `API_KEY` to communicate with the Google Gemini service.
2.  **Backend - Database Integration:**
    *   Select and integrate a production database (e.g., PostgreSQL, MongoDB).
    *   Implement services for data persistence (patient profiles, interaction episodes, marketplace applications, etc.).
3.  **Backend - Authentication & Authorization:**
    *   Secure backend API endpoints (e.g., API keys for EMR/HIS clients, JWT for potential user sessions if marketplace entities need to log in).
4.  **Backend - Input Validation:**
    *   Implement rigorous validation for all API request data.

### Essential for Production:
5.  **Comprehensive Testing:**
    *   Unit, integration, and end-to-end tests for both frontend and backend.
6.  **Build & Deployment Process:**
    *   **Frontend:** Use a bundler (Vite, Webpack via CRA) for production builds (minification, optimization, code splitting).
    *   **Backend:** Ensure build process (`npm run build`) is part of deployment.
    *   Implement CI/CD pipelines (e.g., GitHub Actions, Jenkins).
7.  **Hosting & Infrastructure:**
    *   Choose hosting providers for frontend (e.g., Vercel, Netlify, AWS S3/CloudFront) and backend (e.g., AWS, Google Cloud, Azure, Heroku).
    *   Containerize applications (Docker) for consistency and scalability.
8.  **API Documentation (Backend):**
    *   Generate and maintain API documentation using OpenAPI/Swagger.
9.  **Robust Logging & Monitoring (Backend):**
    *   Implement structured logging to a persistent service.
    *   Set up monitoring and alerting.
10. **Security Hardening (Backend):**
    *   Rate limiting, security headers (Helmet), refined CORS policy.
11. **Healthcare Compliance (If applicable):**
    *   If handling real Patient Health Information (PHI), ensure full compliance with relevant regulations (HIPAA, GDPR, etc.). This is a major undertaking involving technical, administrative, and physical safeguards.

### Desirable Enhancements:
*   **Frontend State Management:** Consider a dedicated library for complex state.
*   **Frontend Accessibility (A11y):** Conduct a full audit and implement improvements.
*   **Frontend Performance:** Detailed performance profiling and optimization.
*   **Backend Scalability:** Load balancing, and potentially serverless functions for specific tasks.
*   **Marketplace Backend Logic:** Fully implement backend support for marketplace onboarding, verification, and management.

## Contributing

This project is currently in a developmental phase. Contributions that address the "Path to Production" items, particularly security and backend robustness, would be highly valuable. Please adhere to standard coding practices and ensure any new AI interactions align with ethical AI principles.

*(Placeholder: More detailed contribution guidelines can be added here, e.g., code style, pull request process.)*

## License

*(Placeholder: Specify a license, e.g., MIT, Apache 2.0, or proprietary.)*

---

This README aims to provide a comprehensive overview. As the project evolves, ensure this document is kept up-to-date.