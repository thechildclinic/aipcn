import { Router } from 'express';
import * as symptomCheckerController from '../controllers/symptomCheckerController'; // For generate-full
import * as prescriptionController from '../controllers/prescriptionController'; // For keywords

const router = Router();

// Route for generating a full prescription with educational content
router.post('/generate-full', symptomCheckerController.handleGeneratePrescriptionWithEducation);

// Route for generating prescription keywords
router.post('/keywords', prescriptionController.handleGeneratePrescriptionKeywords);


export default router;