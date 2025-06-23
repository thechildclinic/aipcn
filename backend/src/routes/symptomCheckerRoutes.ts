import { Router } from 'express';
import * as symptomCheckerController from '../controllers/symptomCheckerController';

const router = Router();

// Route for initiating a symptom check and getting the first question
router.post('/initial-assessment', symptomCheckerController.handleInitialAssessment);

// Route for getting a provisional diagnosis based on chat history
router.post('/provisional-diagnosis', symptomCheckerController.handleProvisionalDiagnosis);

// Route for generating doctor notes
router.post('/doctor-notes', symptomCheckerController.handleGenerateDoctorNotes);

// New routes
router.post('/suggest-tests', symptomCheckerController.handleSuggestTests);
router.post('/refine-diagnosis', symptomCheckerController.handleRefineDiagnosis);


export default router;