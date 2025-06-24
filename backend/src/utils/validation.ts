import Joi from 'joi';

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20),
  password: Joi.string().min(8).max(255).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  name: Joi.string().min(1).max(255).trim(),
  address: Joi.string().min(5).max(500).trim(),
  url: Joi.string().uri(),
  currency: Joi.string().length(3).uppercase(),
  amount: Joi.number().positive().precision(2),
  rating: Joi.number().min(0).max(5),
  percentage: Joi.number().min(0).max(100),
};

// User validation schemas
export const userSchemas = {
  create: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    role: Joi.string().valid('patient', 'doctor', 'pharmacy_staff', 'lab_staff', 'admin').required(),
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
  }),

  update: Joi.object({
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
    isActive: Joi.boolean().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),
};

// Patient validation schemas
export const patientSchemas = {
  create: Joi.object({
    userId: commonSchemas.uuid,
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    address: commonSchemas.address.optional(),
    emergencyContactName: commonSchemas.name.optional(),
    emergencyContactPhone: commonSchemas.phone.optional(),
    allergies: Joi.array().items(Joi.string().trim()).optional(),
    currentMedications: Joi.array().items(Joi.string().trim()).optional(),
    preferredLanguage: Joi.string().length(2).optional(),
  }),

  update: Joi.object({
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    address: commonSchemas.address.optional(),
    emergencyContactName: commonSchemas.name.optional(),
    emergencyContactPhone: commonSchemas.phone.optional(),
    allergies: Joi.array().items(Joi.string().trim()).optional(),
    currentMedications: Joi.array().items(Joi.string().trim()).optional(),
    preferredLanguage: Joi.string().length(2).optional(),
  }),
};

// Marketplace Application validation schemas
export const marketplaceApplicationSchemas = {
  create: Joi.object({
    businessType: Joi.string().valid('clinic', 'lab', 'pharmacy').required(),
    businessName: commonSchemas.name.required(),
    address: commonSchemas.address.required(),
    contactEmail: commonSchemas.email,
    contactPhone: commonSchemas.phone.required(),
    website: commonSchemas.url.optional(),
    clinicSpecialties: Joi.string().when('businessType', { is: 'clinic', then: Joi.required(), otherwise: Joi.forbidden() }),
    doctorCount: Joi.number().integer().min(1).when('businessType', { is: 'clinic', then: Joi.required(), otherwise: Joi.forbidden() }),
    labTestTypes: Joi.string().when('businessType', { is: 'lab', then: Joi.required(), otherwise: Joi.forbidden() }),
    labCertifications: Joi.string().when('businessType', { is: 'lab', then: Joi.required(), otherwise: Joi.forbidden() }),
    pharmacyServices: Joi.string().when('businessType', { is: 'pharmacy', then: Joi.required(), otherwise: Joi.forbidden() }),
    prescriptionDelivery: Joi.boolean().when('businessType', { is: 'pharmacy', then: Joi.optional(), otherwise: Joi.forbidden() }),
    regulatoryComplianceNotes: Joi.string().min(10).max(1000).required(),
    attestedCompliance: Joi.boolean().valid(true).required(),
    serviceRegion: Joi.string().min(2).max(100).optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('submitted', 'under_review', 'approved', 'rejected').required(),
    reviewedBy: Joi.string().required(),
    reviewNotes: Joi.string().min(5).max(1000).optional(),
  }),
};

// Provider validation schemas
export const providerSchemas = {
  create: Joi.object({
    applicationId: commonSchemas.uuid,
    type: Joi.string().valid('pharmacy', 'lab').required(),
    name: commonSchemas.name.required(),
    address: commonSchemas.address.required(),
    serviceRegion: Joi.string().min(2).max(100).required(),
    contactEmail: commonSchemas.email,
    contactPhone: commonSchemas.phone.required(),
    website: commonSchemas.url.optional(),
    servicesOffered: Joi.array().items(Joi.string().trim()).min(1).required(),
    certifications: Joi.array().items(Joi.string().trim()).optional(),
    offersDelivery: Joi.boolean().optional(),
    deliveryRadius: Joi.number().positive().optional(),
    testsOffered: Joi.array().items(Joi.string().trim()).optional(),
    avgTurnaroundTimeHours: Joi.number().integer().positive().optional(),
    maxCapacity: Joi.number().integer().positive().optional(),
  }),

  update: Joi.object({
    serviceRegion: Joi.string().min(2).max(100).optional(),
    contactEmail: commonSchemas.email.optional(),
    contactPhone: commonSchemas.phone.optional(),
    website: commonSchemas.url.optional(),
    servicesOffered: Joi.array().items(Joi.string().trim()).min(1).optional(),
    certifications: Joi.array().items(Joi.string().trim()).optional(),
    offersDelivery: Joi.boolean().optional(),
    deliveryRadius: Joi.number().positive().optional(),
    testsOffered: Joi.array().items(Joi.string().trim()).optional(),
    avgTurnaroundTimeHours: Joi.number().integer().positive().optional(),
    isActive: Joi.boolean().optional(),
    acceptingNewOrders: Joi.boolean().optional(),
    maxCapacity: Joi.number().integer().positive().optional(),
  }),
};

// Order validation schemas
export const orderSchemas = {
  create: Joi.object({
    patientId: commonSchemas.uuid,
    type: Joi.string().valid('pharmacy', 'lab').required(),
    requestingDoctorName: commonSchemas.name.optional(),
    clinicAddress: commonSchemas.address.optional(),
    clinicLicense: Joi.string().optional(),
    prescriptionData: Joi.object().when('type', { is: 'pharmacy', then: Joi.required(), otherwise: Joi.forbidden() }),
    testData: Joi.object().when('type', { is: 'lab', then: Joi.required(), otherwise: Joi.forbidden() }),
    patientNotes: Joi.string().max(1000).optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'pending_broadcast', 'awaiting_bids', 'bids_received', 'assigned', 
      'in_progress', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'
    ).required(),
    notes: Joi.string().max(1000).optional(),
  }),

  assign: Joi.object({
    providerId: commonSchemas.uuid,
    notes: Joi.string().max(1000).optional(),
  }),
};

// Bid validation schemas
export const bidSchemas = {
  create: Joi.object({
    orderId: commonSchemas.uuid,
    providerId: commonSchemas.uuid,
    bidAmount: commonSchemas.amount,
    currency: commonSchemas.currency.default('USD'),
    estimatedDeliveryTime: Joi.string().max(100).optional(),
    estimatedTurnaroundTime: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).optional(),
    validUntil: Joi.date().greater('now').optional(),
  }),

  respond: Joi.object({
    status: Joi.string().valid('accepted', 'rejected').required(),
    notes: Joi.string().max(1000).optional(),
  }),
};

// Algorithm Configuration validation schemas
export const algorithmConfigSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    priceWeight: Joi.number().min(0).max(1).required(),
    speedWeight: Joi.number().min(0).max(1).required(),
    qualityWeight: Joi.number().min(0).max(1).required(),
    maxBidWaitTimeMinutes: Joi.number().integer().min(1).max(1440).default(30),
    minBidsRequired: Joi.number().integer().min(1).default(1),
    maxBidsConsidered: Joi.number().integer().min(1).default(10),
    serviceType: Joi.string().valid('pharmacy', 'lab', 'both').default('both'),
  }).custom((value, helpers) => {
    const sum = value.priceWeight + value.speedWeight + value.qualityWeight;
    if (Math.abs(sum - 1.0) > 0.001) {
      return helpers.error('custom.weightsSum');
    }
    return value;
  }, 'Weights validation').messages({
    'custom.weightsSum': 'Price, speed, and quality weights must sum to 1.0',
  }),

  update: Joi.object({
    description: Joi.string().max(500).optional(),
    priceWeight: Joi.number().min(0).max(1).optional(),
    speedWeight: Joi.number().min(0).max(1).optional(),
    qualityWeight: Joi.number().min(0).max(1).optional(),
    maxBidWaitTimeMinutes: Joi.number().integer().min(1).max(1440).optional(),
    minBidsRequired: Joi.number().integer().min(1).optional(),
    maxBidsConsidered: Joi.number().integer().min(1).optional(),
    serviceType: Joi.string().valid('pharmacy', 'lab', 'both').optional(),
    isActive: Joi.boolean().optional(),
  }).custom((value, helpers) => {
    if (value.priceWeight !== undefined || value.speedWeight !== undefined || value.qualityWeight !== undefined) {
      // If any weight is being updated, validate the sum
      const priceWeight = value.priceWeight ?? 0;
      const speedWeight = value.speedWeight ?? 0;
      const qualityWeight = value.qualityWeight ?? 0;
      
      if (priceWeight + speedWeight + qualityWeight > 0) {
        const sum = priceWeight + speedWeight + qualityWeight;
        if (Math.abs(sum - 1.0) > 0.001) {
          return helpers.error('custom.weightsSum');
        }
      }
    }
    return value;
  }, 'Weights validation').messages({
    'custom.weightsSum': 'Price, speed, and quality weights must sum to 1.0',
  }),
};

// Validation helper function
export const validateSchema = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ValidationError('Validation failed', details);
  }
  
  return value;
};

// Custom validation error class
export class ValidationError extends Error {
  public details: Array<{ field: string; message: string }>;
  
  constructor(message: string, details: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
