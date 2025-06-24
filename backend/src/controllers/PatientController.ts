import { Request, Response } from 'express';
import { patientService } from '../services';
import { validateSchema, patientSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

export class PatientController {
  /**
   * Get patient profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    
    const patient = await patientService.findByIdWithUser(patientId);
    
    res.json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: { patient },
    });
  });

  /**
   * Update patient profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const updateData = validateSchema(patientSchemas.update, req.body);
    
    const patient = await patientService.update(patientId, updateData);
    
    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: { patient },
    });
  });

  /**
   * Get patient by user ID
   */
  getByUserId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    
    const patient = await patientService.findByUserIdRequired(userId);
    
    res.json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: { patient },
    });
  });

  /**
   * Search patients (admin/healthcare staff only)
   */
  searchPatients = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { 
      name, 
      email, 
      phone, 
      gender, 
      minAge, 
      maxAge, 
      allergies, 
      medications,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const searchCriteria: any = {};
    
    if (name) searchCriteria.name = name as string;
    if (email) searchCriteria.email = email as string;
    if (phone) searchCriteria.phone = phone as string;
    if (gender) searchCriteria.gender = gender as string;
    
    if (minAge || maxAge) {
      searchCriteria.age = {};
      if (minAge) searchCriteria.age.min = Number(minAge);
      if (maxAge) searchCriteria.age.max = Number(maxAge);
    }
    
    if (allergies) {
      searchCriteria.allergies = Array.isArray(allergies) ? allergies : [allergies];
    }
    
    if (medications) {
      searchCriteria.medications = Array.isArray(medications) ? medications : [medications];
    }
    
    const patients = await patientService.searchPatients(searchCriteria);
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPatients = patients.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Patients retrieved successfully',
      data: {
        patients: paginatedPatients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: patients.length,
          totalPages: Math.ceil(patients.length / Number(limit)),
        },
      },
    });
  });

  /**
   * Get patient allergies
   */
  getAllergies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    
    const patient = await patientService.findById(patientId);
    
    res.json({
      success: true,
      message: 'Patient allergies retrieved successfully',
      data: { allergies: patient.allergies || [] },
    });
  });

  /**
   * Update patient allergies
   */
  updateAllergies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { allergies } = req.body;
    
    if (!Array.isArray(allergies)) {
      res.status(400).json({
        success: false,
        message: 'Allergies must be an array',
        error: 'INVALID_ALLERGIES_FORMAT',
      });
      return;
    }
    
    const patient = await patientService.updateAllergies(patientId, allergies);
    
    res.json({
      success: true,
      message: 'Patient allergies updated successfully',
      data: { patient },
    });
  });

  /**
   * Add allergy to patient
   */
  addAllergy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { allergy } = req.body;
    
    if (!allergy || typeof allergy !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Allergy must be a non-empty string',
        error: 'INVALID_ALLERGY',
      });
      return;
    }
    
    const patient = await patientService.addAllergy(patientId, allergy);
    
    res.json({
      success: true,
      message: 'Allergy added successfully',
      data: { patient },
    });
  });

  /**
   * Remove allergy from patient
   */
  removeAllergy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId, allergy } = req.params;
    
    const patient = await patientService.removeAllergy(patientId, allergy);
    
    res.json({
      success: true,
      message: 'Allergy removed successfully',
      data: { patient },
    });
  });

  /**
   * Get patient medications
   */
  getMedications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    
    const patient = await patientService.findById(patientId);
    
    res.json({
      success: true,
      message: 'Patient medications retrieved successfully',
      data: { medications: patient.currentMedications || [] },
    });
  });

  /**
   * Update patient medications
   */
  updateMedications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { medications } = req.body;
    
    if (!Array.isArray(medications)) {
      res.status(400).json({
        success: false,
        message: 'Medications must be an array',
        error: 'INVALID_MEDICATIONS_FORMAT',
      });
      return;
    }
    
    const patient = await patientService.updateMedications(patientId, medications);
    
    res.json({
      success: true,
      message: 'Patient medications updated successfully',
      data: { patient },
    });
  });

  /**
   * Add medication to patient
   */
  addMedication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { medication } = req.body;
    
    if (!medication || typeof medication !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Medication must be a non-empty string',
        error: 'INVALID_MEDICATION',
      });
      return;
    }
    
    const patient = await patientService.addMedication(patientId, medication);
    
    res.json({
      success: true,
      message: 'Medication added successfully',
      data: { patient },
    });
  });

  /**
   * Remove medication from patient
   */
  removeMedication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId, medication } = req.params;
    
    const patient = await patientService.removeMedication(patientId, medication);
    
    res.json({
      success: true,
      message: 'Medication removed successfully',
      data: { patient },
    });
  });

  /**
   * Update medical history
   */
  updateMedicalHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { medicalHistory } = req.body;
    
    const patient = await patientService.updateMedicalHistory(patientId, medicalHistory);
    
    res.json({
      success: true,
      message: 'Medical history updated successfully',
      data: { patient },
    });
  });

  /**
   * Update insurance information
   */
  updateInsurance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { insuranceInfo } = req.body;
    
    const patient = await patientService.updateInsuranceInfo(patientId, insuranceInfo);
    
    res.json({
      success: true,
      message: 'Insurance information updated successfully',
      data: { patient },
    });
  });

  /**
   * Get patient statistics (admin only)
   */
  getStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const statistics = await patientService.getPatientStatistics();
    
    res.json({
      success: true,
      message: 'Patient statistics retrieved successfully',
      data: { statistics },
    });
  });

  /**
   * Get patient orders
   */
  getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const orders = await patientService.getPatientOrders(patientId);
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Patient orders retrieved successfully',
      data: {
        orders: paginatedOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: orders.length,
          totalPages: Math.ceil(orders.length / Number(limit)),
        },
      },
    });
  });
}
