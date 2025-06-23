import { Router } from 'express';
import * as marketplaceController from '../controllers/marketplaceController';
// import { authenticateProvider } from '../middleware/authMiddleware'; // Future middleware

const router = Router();

// --- Provider Onboarding/Registration ---
// Corresponds to the frontend MarketplaceOnboardingFormStage submission
router.post('/register/pharmacy', marketplaceController.handleRegisterPharmacy);
router.post('/register/lab', marketplaceController.handleRegisterLab);
// router.post('/register/clinic', marketplaceController.handleRegisterClinic); // If clinics also onboard this way

// --- Provider Profile Management (Conceptual - would need auth) ---
router.get('/providers/:providerId', marketplaceController.handleGetProviderProfile);
// router.put('/providers/:providerId', authenticateProvider, marketplaceController.handleUpdateProviderProfile);

// --- Listing Providers (e.g., for admin or internal use, or if patients can browse) ---
// router.get('/providers/pharmacies', marketplaceController.listPharmacies);
// router.get('/providers/labs', marketplaceController.listLabs);


// TODO: Endpoints for application status check by applicants (e.g., /applications/:applicationId/status)

export default router;
