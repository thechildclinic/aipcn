import { Router } from 'express';
import * as doctorAssistController from '../controllers/doctorAssistController';

const router = Router();

router.post('/note-suggestions', doctorAssistController.handleGenerateDoctorNoteSuggestions);
router.post('/ddx', doctorAssistController.handleGenerateDifferentialDiagnoses);
router.post('/ddx-actions', doctorAssistController.handleSuggestActionsForDDx);

// Enhanced AI Assistant Routes
router.post('/autocomplete', doctorAssistController.handleContextualAutocomplete);
router.post('/smart-suggestions', doctorAssistController.handleSmartSuggestions);
router.post('/summarize-notes', doctorAssistController.handleSummarizeNotes);

// Phase 4-6: Advanced Clinical Decision Support Routes
router.post('/specialty-diagnosis', doctorAssistController.handleSpecialtyAwareProvisionalDiagnosis);
router.post('/drug-interactions', doctorAssistController.handleDrugInteractionCheck);
router.post('/automated-treatment-plan', doctorAssistController.handleGenerateAutomatedTreatmentPlan);

export default router;