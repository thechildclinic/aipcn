// Export all services
export { BaseService, NotFoundError, ConflictError, DatabaseError } from './BaseService';
export { UserService } from './UserService';
export { PatientService } from './PatientService';
export { MarketplaceApplicationService } from './MarketplaceApplicationService';
export { ProviderService } from './ProviderService';
export { OrderService } from './OrderService';
export { BidService } from './BidService';
export { AlgorithmConfigurationService } from './AlgorithmConfigurationService';

// Export business logic services
export { OrderOrchestrationService } from './OrderOrchestrationService';
export { ProviderMatchingService } from './ProviderMatchingService';
export { TreatmentPlanService } from './TreatmentPlanService';

// Export service interfaces and types
export type { 
  UserUpdateAttributes, 
  LoginCredentials, 
  AuthResult, 
  ChangePasswordData, 
  TokenPayload 
} from './UserService';

export type { 
  PatientUpdateAttributes, 
  PatientSearchCriteria 
} from './PatientService';

export type { 
  MarketplaceApplicationUpdateAttributes, 
  StatusUpdateData, 
  ApplicationSearchCriteria 
} from './MarketplaceApplicationService';

export type { 
  ProviderUpdateAttributes, 
  ProviderSearchCriteria 
} from './ProviderService';

export type { 
  OrderUpdateAttributes, 
  StatusUpdateData as OrderStatusUpdateData, 
  OrderAssignmentData, 
  OrderSearchCriteria 
} from './OrderService';

export type { 
  BidUpdateAttributes, 
  BidResponseData, 
  BidSearchCriteria 
} from './BidService';

export type { 
  AlgorithmConfigurationUpdateAttributes 
} from './AlgorithmConfigurationService';

// Import service classes
import { UserService } from './UserService';
import { PatientService } from './PatientService';
import { MarketplaceApplicationService } from './MarketplaceApplicationService';
import { ProviderService } from './ProviderService';
import { OrderService } from './OrderService';
import { BidService } from './BidService';
import { AlgorithmConfigurationService } from './AlgorithmConfigurationService';

// Import business logic services
import { OrderOrchestrationService } from './OrderOrchestrationService';
import { ProviderMatchingService } from './ProviderMatchingService';
import { TreatmentPlanService } from './TreatmentPlanService';

// Create service instances (singleton pattern)
export const userService = new UserService();
export const patientService = new PatientService();
export const marketplaceApplicationService = new MarketplaceApplicationService();
export const providerService = new ProviderService();
export const orderService = new OrderService();
export const bidService = new BidService();
export const algorithmConfigurationService = new AlgorithmConfigurationService();

// Create business logic service instances
export const orderOrchestrationService = new OrderOrchestrationService();
export const providerMatchingService = new ProviderMatchingService();
export const treatmentPlanService = new TreatmentPlanService();
