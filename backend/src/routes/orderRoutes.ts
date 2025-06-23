import { Router } from 'express';
import * as orderController from '../controllers/orderController';
// import { authenticatePatient, authenticateProvider, authenticateAdmin } from '../middleware/authMiddleware'; // Future

const router = Router();

// --- Order Creation & Broadcasting (Patient/Doctor Initiated) ---
// These endpoints would be called by the frontend (e.g., from DoctorPatientViewStage after prescription is finalized)
router.post('/pharmacy/broadcast', /* authenticatePatientOrDoctor, */ orderController.handleBroadcastPharmacyOrder);
router.post('/lab/broadcast', /* authenticatePatientOrDoctor, */ orderController.handleBroadcastLabOrder);

// --- Bidding by Providers (Pharmacy/Lab) ---
// These would be called by the Pharmacy/Lab's own system or a dedicated provider portal
router.post('/:orderId/bids', /* authenticateProvider, */ orderController.handleSubmitBid);
// router.get('/:orderId/bids', /* authenticateAdmin, */ orderController.listBidsForOrder); // For admin to see bids

// --- Order Assignment (System/Admin Initiated, based on algorithm) ---
// This might be an internal call or an admin panel function
router.put('/:orderId/assign', /* authenticateAdminOrSystem, */ orderController.handleAssignOrder);

// --- Order Status Updates (Provider Initiated) ---
router.put('/:orderId/status', /* authenticateProvider, */ orderController.handleUpdateOrderStatus);

// --- Order Tracking/Details (Patient, Provider, Admin) ---
router.get('/:orderId', /* authenticateUser, */ orderController.handleGetOrderDetails);
// router.get('/patient/:patientId', authenticatePatient, orderController.listOrdersForPatient);
// router.get('/provider/:providerId', authenticateProvider, orderController.listOrdersForProvider);


// --- Lab Result Upload & Analysis (Conceptual) ---
// router.post('/:orderId/lab/results/upload', authenticateProvider, orderController.handleUploadLabResults); // Needs file upload (e.g. multer)
// router.get('/:orderId/lab/results/analysis/:analysisId', authenticateDoctor, orderController.getLabResultAnalysis);


export default router;
