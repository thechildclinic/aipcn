# Primary Care AI Assistant - Backend API

This backend provides API endpoints for the AI-driven functionalities of the Primary Care Assistant application, including patient interactions, doctor assistance tools, and a marketplace for pharmacies and labs.

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Google Gemini API Key

## Setup

1.  **Clone the repository (or ensure this `backend` directory is present).**

2.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

4.  **Set up environment variables:**
    *   Create a `.env` file in the `backend` directory by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Google Gemini `API_KEY`.
    *   (Optional) Configure `PORT` and `DATABASE_URL` if needed.

## Running the Server

### Development Mode (with hot-reloading using Nodemon)

```bash
npm run dev
```
The server will typically start on `http://localhost:3001` (or the port specified in your `.env`).

### Production Mode

1.  **Build the TypeScript code:**
    ```bash
    npm run build
    ```
    This will compile the TypeScript files from `src` into JavaScript files in the `dist` directory.

2.  **Start the server:**
    ```bash
    npm start
    ```

## API Structure

-   **`src/server.ts`**: Main server setup, middleware, and route mounting.
-   **`src/routes/`**: API route definitions (e.g., `symptomCheckerRoutes.ts`, `marketplaceRoutes.ts`, `orderRoutes.ts`).
-   **`src/controllers/`**: Request handling logic for each route.
-   **`src/services/`**: Business logic, including:
    -   `geminiService.ts`: Interactions with the Google Gemini API.
    -   `marketplaceService.ts` (New - Stub): Managing pharmacy/lab provider profiles and applications.
    -   `orderOrchestrationService.ts` (New - Stub): Handling order lifecycle (broadcasting, bids, assignment, status).
    -   `algorithmService.ts` (New - Stub): Logic for evaluating bids based on configurable factors.
    -   (Future) `databaseService.ts`: Abstracting database interactions.
    -   (Future) `notificationService.ts`: Handling real-time notifications.
-   **`src/types.ts`**: Shared TypeScript types and interfaces for backend data models and API contracts.
-   **`src/config/`**: Configuration management (e.g., loading environment variables).
-   **(Future) `src/middleware/`**: Custom middleware (e.g., authentication, advanced validation).

## Core API Endpoints

### Symptom Checking & Doctor Assist
-   `POST /api/symptom-checker/initial-assessment`: Initiates symptom check.
-   `POST /api/symptom-checker/provisional-diagnosis`: Gets provisional diagnosis.
-   `POST /api/symptom-checker/doctor-notes`: Generates notes for a doctor.
-   `POST /api/symptom-checker/suggest-tests`: Suggests tests based on a condition.
-   `POST /api/symptom-checker/refine-diagnosis`: Refines diagnosis with test results.
-   `POST /api/prescription/generate-full`: Generates a prescription with education.
-   `POST /api/prescription/keywords`: Suggests keywords for prescription notes.
-   `POST /api/doctor-assist/note-suggestions`: Provides real-time suggestions for doctor's notes.
-   `POST /api/doctor-assist/ddx`: Generates differential diagnoses.
-   `POST /api/doctor-assist/ddx-actions`: Suggests actions for a selected DDx.

### Marketplace (Pharmacy/Lab) Management (New - Stubs)
-   `POST /api/marketplace/register/pharmacy`: Onboard a new pharmacy.
    -   Request: `RegisterProviderRequest` (based on `MarketplaceApplication` type)
    -   Response: `MarketplaceApplication` (with ID and status)
-   `POST /api/marketplace/register/lab`: Onboard a new lab.
-   `GET /api/marketplace/providers/:providerId`: Get public profile of an approved provider.
    -   Response: `ProviderProfile` (either `PharmacyProviderProfile` or `LabProviderProfile`)

### Order Fulfillment & Bidding (New - Stubs)
-   `POST /api/orders/pharmacy/broadcast`: Broadcast a prescription order to the pharmacy network.
    -   Request: `{ patientProfile: PatientProfile, prescription: Prescription }`
    -   Response: `BroadcastOrderResponse` (includes `orderId`)
-   `POST /api/orders/lab/broadcast`: Broadcast a lab test order.
    -   Request: `{ patientProfile: PatientProfile, tests: TestRecommendation[], requestingDoctor: DoctorInfo }`
-   `POST /api/orders/:orderId/bids`: A pharmacy/lab submits a bid for an order.
    -   Request: `SubmitBidRequest` (based on `BidDetails` type)
    -   Response: `SubmitBidResponse` (includes `bidId`)
-   `PUT /api/orders/:orderId/assign`: (System/Admin) Assigns an order to the winning bidder.
    -   Conceptually, this uses `algorithmService` to evaluate bids.
    -   Response: Updated `MarketOrder`
-   `PUT /api/orders/:orderId/status`: A pharmacy/lab updates the status of an assigned order.
    -   Request: `UpdateOrderStatusRequest` (includes `newStatus` and relevant details)
    -   Response: Updated `MarketOrder`
-   `GET /api/orders/:orderId`: Get details of a specific order (including status, assigned provider, bids if applicable).

### Algorithm Configuration (New - Stubs)
-   `GET /api/config/algorithm-factors`: Get current weighting factors for pharmacy and lab selection algorithms.
    -   Response: `{ pharmacyFactors: AlgorithmFactorWeights, labFactors: AlgorithmFactorWeights }`
-   `PUT /api/config/algorithm-factors`: (Admin) Update algorithm factor weights.
    -   Request: `{ type: 'PHARMACY' | 'LAB', factors: AlgorithmFactorWeights }`

## Key Backend Logic & Future Development Areas

### 1. Database Integration
-   **Schema Design:**
    -   `Patients`: Storing `PatientProfile` data.
    -   `MarketplaceApplications`: For `Clinic`, `Pharmacy`, `Lab` onboarding applications, tracking status.
    -   `ProviderProfiles`: Approved and active `PharmacyProviderProfile` and `LabProviderProfile` data, including ratings, service details, operational status.
    -   `MarketOrders`: Storing `PharmacyOrderDetails` and `LabOrderDetails`, including status history, patient/doctor snapshots, assigned provider, pricing.
    -   `Bids`: Storing `BidDetails` linked to orders and providers.
    -   `AlgorithmConfigurations`: Storing `AlgorithmFactorWeights` for pharmacy and lab selections.
    -   (Optional) `AuditLogs`, `UserAccounts` (for providers/admins).
-   **Service Layer:** Implement a `databaseService.ts` or use an ORM (e.g., Prisma, TypeORM) to interact with the chosen database (e.g., PostgreSQL, MongoDB).

### 2. Marketplace & Order Orchestration (`marketplaceService.ts`, `orderOrchestrationService.ts`)
-   **Provider Onboarding Workflow:** Application submission, admin review (manual or semi-automated), approval/rejection, profile creation.
-   **Order Broadcasting:** Logic to identify relevant providers (based on service region, specialization, capacity) to notify about new orders.
-   **Bid Management:** Storing, retrieving, and managing bids. Setting bid deadlines.
-   **Order Assignment:** Triggering `algorithmService.evaluateBids` and updating the order with the winning provider.
-   **Status Management:** Validating status transitions and updating orders. Logging all status changes.
-   **Notifications:** Integrating a `notificationService.ts` to inform:
    -   Providers about new orders relevant to them.
    -   Providers when their bid wins or an order is assigned.
    -   Patients about order acceptance, progress (preparation, dispatch, ready for pickup), and completion.

### 3. Bidding Algorithm (`algorithmService.ts`)
-   **Factor Normalization:** Develop robust methods to normalize different bid attributes (price, speed, quality metrics) into a comparable scale (e.g., 0-1).
-   **Scoring Function:** Implement the weighted scoring logic: `score = (normPrice * priceWeight) + (normSpeed * speedWeight) + (normQuality * qualityWeight) ...`.
-   **Configurability:** Ensure factors and their weights can be easily updated via API (`/api/config/algorithm-factors`).
-   **Tie-breaking rules.**
-   **Extensibility:** Design to potentially add more factors (e.g., provider's historical performance on similar orders, patient preferences if captured).

### 4. Real-time Notifications (e.g., WebSockets)
-   For instant updates to providers about new orders and to patients about order status changes.
-   A `notificationService.ts` could manage WebSocket connections or integrate with push notification services.

### 5. Lab Result Processing (OCR & AI Analysis)
-   **File Upload:** Implement secure PDF file uploads for lab results (e.g., using `multer` middleware). Store files securely (e.g., cloud storage).
-   **OCR Integration:** Integrate with an OCR service (e.g., Google Cloud Vision API, AWS Textract) to extract text from PDFs.
    -   This would likely be an asynchronous process.
-   **AI Summary:** Pass the OCR-extracted text to `geminiService.ts` with a specific prompt to generate a structured summary for the doctor.
-   **Update Order:** Store the OCR text and AI summary with the `LabOrderDetails`. Notify the doctor.

### 6. Authentication & Authorization
-   **Provider Authentication:** Secure endpoints for providers (submitting bids, updating status) using API keys or JWTs after login.
-   **Admin Authentication:** Secure configuration endpoints.
-   **Patient Authentication (Optional):** If patients have accounts to track orders.

## Future Enhancements
-   Payment integration.
-   Advanced analytics and reporting for providers and platform admins.
-   Deeper EMR/HIS integration capabilities (e.g., FHIR).
-   Machine learning for optimizing provider matching or predicting demand.
-   Comprehensive error handling, logging, and monitoring for production.
-   Automated testing (unit, integration, e2e).
```