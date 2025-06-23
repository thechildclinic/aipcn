import { Router } from 'express';
import * as configController from '../controllers/configController';
// import { authenticateAdmin } from '../middleware/authMiddleware'; // Future for securing these endpoints

const router = Router();

// --- Algorithm Factor Weights Configuration ---
// These endpoints would typically be accessed by an admin interface
router.get('/algorithm-factors', /* authenticateAdmin, */ configController.handleGetAlgorithmFactors);
router.put('/algorithm-factors', /* authenticateAdmin, */ configController.handleUpdateAlgorithmFactors);


// Could add other global config endpoints here in the future
// e.g., feature flags, system messages, etc.

export default router;
