import { FindOptions, Op } from 'sequelize';
import MarketplaceApplication, {
  MarketplaceApplicationAttributes,
  MarketplaceApplicationCreationAttributes,
  BusinessType,
  ApplicationStatus
} from '../models/MarketplaceApplication';
import { BaseService, NotFoundError } from './BaseService';
import { validateSchema, marketplaceApplicationSchemas, ValidationError } from '../utils/validation';

// Application update attributes
export interface MarketplaceApplicationUpdateAttributes {
  businessName?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  clinicSpecialties?: string;
  doctorCount?: number;
  labTestTypes?: string;
  labCertifications?: string;
  pharmacyServices?: string;
  prescriptionDelivery?: boolean;
  regulatoryComplianceNotes?: string;
  serviceRegion?: string;
}

// Status update data
export interface StatusUpdateData {
  status: ApplicationStatus;
  reviewedBy: string;
  reviewNotes?: string;
}

// Application search criteria
export interface ApplicationSearchCriteria {
  businessType?: BusinessType;
  status?: ApplicationStatus;
  businessName?: string;
  serviceRegion?: string;
  submittedAfter?: Date;
  submittedBefore?: Date;
}

export class MarketplaceApplicationService extends BaseService<
  MarketplaceApplication, 
  MarketplaceApplicationCreationAttributes, 
  MarketplaceApplicationUpdateAttributes
> {
  constructor() {
    super(MarketplaceApplication, 'MarketplaceApplication');
  }

  /**
   * Create a new marketplace application with validation
   */
  async create(data: MarketplaceApplicationCreationAttributes): Promise<MarketplaceApplication> {
    const validatedData = validateSchema(marketplaceApplicationSchemas.create, data);
    return super.create(validatedData);
  }

  /**
   * Update application status
   */
  async updateStatus(id: string, statusData: StatusUpdateData): Promise<MarketplaceApplication> {
    const validatedData = validateSchema(marketplaceApplicationSchemas.updateStatus, statusData);
    
    const application = await this.findById(id);
    
    // Validate status transition
    this.validateStatusTransition(application.status, validatedData.status);
    
    const updateData: any = {
      status: validatedData.status,
      reviewedBy: validatedData.reviewedBy,
      reviewDate: new Date(),
    };
    
    if (validatedData.reviewNotes) {
      updateData.reviewNotes = validatedData.reviewNotes;
    }
    
    return super.update(id, updateData);
  }

  /**
   * Search applications by criteria
   */
  async searchApplications(criteria: ApplicationSearchCriteria, options: FindOptions = {}): Promise<MarketplaceApplication[]> {
    const whereConditions: any = {};

    if (criteria.businessType) {
      whereConditions.businessType = criteria.businessType;
    }

    if (criteria.status) {
      whereConditions.status = criteria.status;
    }

    if (criteria.businessName) {
      whereConditions.businessName = { [Op.iLike]: `%${criteria.businessName}%` };
    }

    if (criteria.serviceRegion) {
      whereConditions.serviceRegion = { [Op.iLike]: `%${criteria.serviceRegion}%` };
    }

    if (criteria.submittedAfter || criteria.submittedBefore) {
      whereConditions.submissionDate = {};
      if (criteria.submittedAfter) {
        whereConditions.submissionDate[Op.gte] = criteria.submittedAfter;
      }
      if (criteria.submittedBefore) {
        whereConditions.submissionDate[Op.lte] = criteria.submittedBefore;
      }
    }

    return this.findAll({
      ...options,
      where: { ...options.where, ...whereConditions },
      order: [['submissionDate', 'DESC']],
    });
  }

  /**
   * Get applications by business type
   */
  async findByBusinessType(businessType: BusinessType, options: FindOptions = {}): Promise<MarketplaceApplication[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, businessType },
    });
  }

  /**
   * Get applications by status
   */
  async findByStatus(status: ApplicationStatus, options: FindOptions = {}): Promise<MarketplaceApplication[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, status },
      order: [['submissionDate', 'ASC']],
    });
  }

  /**
   * Get pending applications (submitted or under review)
   */
  async getPendingApplications(options: FindOptions = {}): Promise<MarketplaceApplication[]> {
    return this.findAll({
      ...options,
      where: {
        ...options.where,
        status: { [Op.in]: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW] },
      },
      order: [['submissionDate', 'ASC']],
    });
  }

  /**
   * Get approved applications
   */
  async getApprovedApplications(options: FindOptions = {}): Promise<MarketplaceApplication[]> {
    return this.findByStatus(ApplicationStatus.APPROVED, options);
  }

  /**
   * Get applications requiring review
   */
  async getApplicationsRequiringReview(): Promise<MarketplaceApplication[]> {
    return this.findByStatus(ApplicationStatus.SUBMITTED);
  }

  /**
   * Approve application
   */
  async approveApplication(id: string, reviewedBy: string, notes?: string): Promise<MarketplaceApplication> {
    return this.updateStatus(id, {
      status: ApplicationStatus.APPROVED,
      reviewedBy,
      reviewNotes: notes,
    });
  }

  /**
   * Reject application
   */
  async rejectApplication(id: string, reviewedBy: string, notes: string): Promise<MarketplaceApplication> {
    return this.updateStatus(id, {
      status: ApplicationStatus.REJECTED,
      reviewedBy,
      reviewNotes: notes,
    });
  }

  /**
   * Put application under review
   */
  async putUnderReview(id: string, reviewedBy: string, notes?: string): Promise<MarketplaceApplication> {
    return this.updateStatus(id, {
      status: ApplicationStatus.UNDER_REVIEW,
      reviewedBy,
      reviewNotes: notes,
    });
  }

  /**
   * Get application statistics
   */
  async getApplicationStatistics(): Promise<{
    total: number;
    byStatus: { [key in ApplicationStatus]: number };
    byBusinessType: { [key in BusinessType]: number };
    pendingCount: number;
    approvalRate: number;
  }> {
    const total = await this.count();
    
    // Status statistics
    const byStatus = {} as { [key in ApplicationStatus]: number };
    for (const status of Object.values(ApplicationStatus)) {
      byStatus[status] = await this.count({ where: { status } });
    }

    // Business type statistics
    const byBusinessType = {} as { [key in BusinessType]: number };
    for (const businessType of Object.values(BusinessType)) {
      byBusinessType[businessType] = await this.count({ where: { businessType } });
    }

    const pendingCount = byStatus[ApplicationStatus.SUBMITTED] + byStatus[ApplicationStatus.UNDER_REVIEW];
    const processedCount = byStatus[ApplicationStatus.APPROVED] + byStatus[ApplicationStatus.REJECTED];
    const approvalRate = processedCount > 0 ? (byStatus[ApplicationStatus.APPROVED] / processedCount) * 100 : 0;

    return {
      total,
      byStatus,
      byBusinessType,
      pendingCount,
      approvalRate,
    };
  }

  /**
   * Get applications with provider information
   */
  async findWithProvider(id: string): Promise<MarketplaceApplication> {
    return this.findById(id, {
      include: [{ association: 'provider' }],
    });
  }

  /**
   * Get recent applications
   */
  async getRecentApplications(limit: number = 10): Promise<MarketplaceApplication[]> {
    return this.findAll({
      limit,
      order: [['submissionDate', 'DESC']],
    });
  }

  /**
   * Get applications by date range
   */
  async getApplicationsByDateRange(startDate: Date, endDate: Date): Promise<MarketplaceApplication[]> {
    return this.findAll({
      where: {
        submissionDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['submissionDate', 'DESC']],
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    const validTransitions: { [key in ApplicationStatus]: ApplicationStatus[] } = {
      [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
      [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.SUBMITTED],
      [ApplicationStatus.APPROVED]: [], // No transitions from approved
      [ApplicationStatus.REJECTED]: [ApplicationStatus.SUBMITTED], // Can resubmit
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError('Invalid status transition', [
        { 
          field: 'status', 
          message: `Cannot transition from ${currentStatus} to ${newStatus}` 
        }
      ]);
    }
  }

  /**
   * Get applications by reviewer
   */
  async getApplicationsByReviewer(reviewedBy: string): Promise<MarketplaceApplication[]> {
    return this.findAll({
      where: { reviewedBy },
      order: [['reviewDate', 'DESC']],
    });
  }

  /**
   * Get application review history
   */
  async getApplicationHistory(id: string): Promise<{
    application: MarketplaceApplication;
    statusHistory: Array<{
      status: ApplicationStatus;
      reviewedBy?: string;
      reviewDate?: Date;
      reviewNotes?: string;
    }>;
  }> {
    const application = await this.findById(id);
    
    // In a real implementation, you might have a separate audit table
    // For now, we'll return the current status as history
    const statusHistory = [{
      status: application.status,
      reviewedBy: application.reviewedBy,
      reviewDate: application.reviewDate,
      reviewNotes: application.reviewNotes,
    }];

    return {
      application,
      statusHistory,
    };
  }
}
