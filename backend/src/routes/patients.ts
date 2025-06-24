import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { 
  authenticate, 
  adminOnly, 
  healthcareStaffOnly,
  patientOrAdmin,
  authorizeOwnership,
  requireActiveAccount,
  auditLog 
} from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';
import { patientSchemas } from '../utils/validation';
import Joi from 'joi';

const router = Router();
const patientController = new PatientController();

// All routes require authentication
router.use(authenticate);
router.use(requireActiveAccount);

// Validation schemas
const allergySchema = Joi.object({
  allergy: Joi.string().min(1).max(100).required(),
});

const allergiesSchema = Joi.object({
  allergies: Joi.array().items(Joi.string().min(1).max(100)).required(),
});

const medicationSchema = Joi.object({
  medication: Joi.string().min(1).max(200).required(),
});

const medicationsSchema = Joi.object({
  medications: Joi.array().items(Joi.string().min(1).max(200)).required(),
});

const medicalHistorySchema = Joi.object({
  medicalHistory: Joi.object().required(),
});

const insuranceSchema = Joi.object({
  insuranceInfo: Joi.object().required(),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Patient profile routes
router.get('/:patientId', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  auditLog('GET_PATIENT_PROFILE'),
  patientController.getProfile
);

router.put('/:patientId', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(patientSchemas.update),
  auditLog('UPDATE_PATIENT_PROFILE'),
  patientController.updateProfile
);

// Get patient by user ID
router.get('/user/:userId', 
  patientOrAdmin,
  authorizeOwnership('userId'),
  auditLog('GET_PATIENT_BY_USER'),
  patientController.getByUserId
);

// Search patients (healthcare staff and admin only)
router.get('/', 
  healthcareStaffOnly,
  validateRequest(paginationSchema, 'query'),
  auditLog('SEARCH_PATIENTS'),
  patientController.searchPatients
);

// Allergy management routes
router.get('/:patientId/allergies', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  auditLog('GET_PATIENT_ALLERGIES'),
  patientController.getAllergies
);

router.put('/:patientId/allergies', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(allergiesSchema),
  auditLog('UPDATE_PATIENT_ALLERGIES'),
  patientController.updateAllergies
);

router.post('/:patientId/allergies', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(allergySchema),
  auditLog('ADD_PATIENT_ALLERGY'),
  patientController.addAllergy
);

router.delete('/:patientId/allergies/:allergy', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  auditLog('REMOVE_PATIENT_ALLERGY'),
  patientController.removeAllergy
);

// Medication management routes
router.get('/:patientId/medications', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  auditLog('GET_PATIENT_MEDICATIONS'),
  patientController.getMedications
);

router.put('/:patientId/medications', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(medicationsSchema),
  auditLog('UPDATE_PATIENT_MEDICATIONS'),
  patientController.updateMedications
);

router.post('/:patientId/medications', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(medicationSchema),
  auditLog('ADD_PATIENT_MEDICATION'),
  patientController.addMedication
);

router.delete('/:patientId/medications/:medication', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  auditLog('REMOVE_PATIENT_MEDICATION'),
  patientController.removeMedication
);

// Medical history routes
router.put('/:patientId/medical-history', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(medicalHistorySchema),
  auditLog('UPDATE_MEDICAL_HISTORY'),
  patientController.updateMedicalHistory
);

// Insurance information routes
router.put('/:patientId/insurance', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(insuranceSchema),
  auditLog('UPDATE_INSURANCE_INFO'),
  patientController.updateInsurance
);

// Patient orders
router.get('/:patientId/orders', 
  patientOrAdmin,
  authorizeOwnership('patientId'),
  validateRequest(paginationSchema, 'query'),
  auditLog('GET_PATIENT_ORDERS'),
  patientController.getOrders
);

// Statistics (admin only)
router.get('/admin/statistics', 
  adminOnly,
  auditLog('GET_PATIENT_STATISTICS'),
  patientController.getStatistics
);

export default router;
