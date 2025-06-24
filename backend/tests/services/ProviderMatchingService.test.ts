import { ProviderMatchingService, MatchingCriteria, ProviderMatch } from '../../src/services/ProviderMatchingService';
import { ProviderService } from '../../src/services/ProviderService';
import { OrderService } from '../../src/services/OrderService';
import { OrderType } from '../../src/models/Order';
import { ProviderType } from '../../src/models/Provider';
import { 
  createMockProvider,
  createMockOrder,
  expectAsync 
} from '../setup';

// Mock the services
jest.mock('../../src/services/ProviderService');
jest.mock('../../src/services/OrderService');
const MockProviderService = ProviderService as jest.MockedClass<typeof ProviderService>;
const MockOrderService = OrderService as jest.MockedClass<typeof OrderService>;

describe('ProviderMatchingService', () => {
  let providerMatchingService: ProviderMatchingService;
  let mockProviderService: jest.Mocked<ProviderService>;
  let mockOrderService: jest.Mocked<OrderService>;
  let mockProviders: any[];

  beforeEach(() => {
    providerMatchingService = new ProviderMatchingService();
    
    // Create mock providers with different characteristics
    mockProviders = [
      createMockProvider({
        id: 'provider-1',
        name: 'City Pharmacy',
        type: ProviderType.PHARMACY,
        address: '123 Main St, Test City, TS 12345',
        averageRating: 4.8,
        acceptingNewOrders: true,
        servicesOffered: ['Prescription Dispensing', 'Delivery'],
        offersDelivery: true,
        currentCapacity: 5,
        maxCapacity: 10,
      }),
      createMockProvider({
        id: 'provider-2',
        name: 'Quick Lab',
        type: ProviderType.LAB,
        address: '456 Health Ave, Test City, TS 12345',
        averageRating: 4.5,
        acceptingNewOrders: true,
        testsOffered: ['Blood Work', 'Lab Testing', 'Urinalysis'],
        avgTurnaroundTimeHours: 24,
        currentCapacity: 8,
        maxCapacity: 10,
      }),
      createMockProvider({
        id: 'provider-3',
        name: 'Suburban Pharmacy',
        type: ProviderType.PHARMACY,
        address: '789 Suburb Rd, Suburb City, TS 12346',
        averageRating: 4.2,
        acceptingNewOrders: true,
        servicesOffered: ['Prescription Dispensing'],
        offersDelivery: false,
        currentCapacity: 9,
        maxCapacity: 10,
      }),
    ];
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock service methods
    mockProviderService = {
      searchProviders: jest.fn().mockResolvedValue(mockProviders),
      count: jest.fn().mockResolvedValue(mockProviders.length),
      getTopRatedProviders: jest.fn().mockResolvedValue(mockProviders.slice(0, 2)),
    } as any;
    
    mockOrderService = {
      getOrderWithDetails: jest.fn().mockResolvedValue(createMockOrder()),
    } as any;
    
    // Replace the service imports with our mocks
    (providerMatchingService as any).providerService = mockProviderService;
    (providerMatchingService as any).orderService = mockOrderService;
  });

  describe('findMatchingProviders', () => {
    const baseCriteria: MatchingCriteria = {
      orderType: OrderType.PHARMACY,
      patientLocation: 'Test City, TS',
      requiredServices: ['Prescription Dispensing'],
      urgency: 'medium',
      minRating: 4.0,
    };

    it('should find and rank providers successfully', async () => {
      const result = await providerMatchingService.findMatchingProviders(baseCriteria);

      expect(mockProviderService.searchProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ProviderType.PHARMACY,
          isActive: true,
          acceptingNewOrders: true,
          minRating: 4.0,
          servicesOffered: ['Prescription Dispensing'],
        })
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(
        expect.objectContaining({
          provider: expect.any(Object),
          matchScore: expect.any(Number),
          matchFactors: expect.objectContaining({
            locationScore: expect.any(Number),
            serviceScore: expect.any(Number),
            qualityScore: expect.any(Number),
            availabilityScore: expect.any(Number),
            priceScore: expect.any(Number),
          }),
          estimatedDistance: expect.any(Number),
          estimatedDeliveryTime: expect.any(String),
        })
      );

      // Results should be sorted by match score (highest first)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].matchScore).toBeGreaterThanOrEqual(result[i + 1].matchScore);
      }
    });

    it('should handle lab order type correctly', async () => {
      const labCriteria: MatchingCriteria = {
        orderType: OrderType.LAB,
        requiredTests: ['Blood Work'],
        urgency: 'high',
      };

      await providerMatchingService.findMatchingProviders(labCriteria);

      expect(mockProviderService.searchProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ProviderType.LAB,
          testsOffered: ['Blood Work'],
        })
      );
    });

    it('should prioritize providers based on urgency', async () => {
      const emergencyCriteria: MatchingCriteria = {
        ...baseCriteria,
        urgency: 'emergency',
      };

      const result = await providerMatchingService.findMatchingProviders(emergencyCriteria);

      // Emergency orders should prioritize location and availability over price
      expect(result).toHaveLength(3);
      
      // The provider with better location/availability should rank higher
      const topProvider = result[0];
      expect(topProvider.matchFactors.locationScore).toBeGreaterThan(0);
      expect(topProvider.matchFactors.availabilityScore).toBeGreaterThan(0);
    });

    it('should consider service capability matching', async () => {
      const specificCriteria: MatchingCriteria = {
        ...baseCriteria,
        requiredServices: ['Prescription Dispensing', 'Delivery'],
      };

      const result = await providerMatchingService.findMatchingProviders(specificCriteria);

      // Provider with delivery service should score higher
      const providerWithDelivery = result.find(r => r.provider.offersDelivery);
      const providerWithoutDelivery = result.find(r => !r.provider.offersDelivery);
      
      if (providerWithDelivery && providerWithoutDelivery) {
        expect(providerWithDelivery.matchFactors.serviceScore)
          .toBeGreaterThan(providerWithoutDelivery.matchFactors.serviceScore);
      }
    });

    it('should penalize providers at high capacity', async () => {
      // Mock a provider at full capacity
      const fullCapacityProvider = createMockProvider({
        id: 'provider-full',
        currentCapacity: 10,
        maxCapacity: 10,
        acceptingNewOrders: false,
      });

      mockProviderService.searchProviders.mockResolvedValue([
        mockProviders[0], // Normal capacity
        fullCapacityProvider,
      ]);

      const result = await providerMatchingService.findMatchingProviders(baseCriteria);

      // Provider at full capacity should have lower availability score
      const normalProvider = result.find(r => r.provider.id === 'provider-1');
      const fullProvider = result.find(r => r.provider.id === 'provider-full');
      
      if (normalProvider && fullProvider) {
        expect(normalProvider.matchFactors.availabilityScore)
          .toBeGreaterThan(fullProvider.matchFactors.availabilityScore);
      }
    });

    it('should estimate delivery times based on provider type and urgency', async () => {
      const result = await providerMatchingService.findMatchingProviders(baseCriteria);

      result.forEach(match => {
        expect(match.estimatedDeliveryTime).toMatch(/\d+(-\d+)?\s+(hours?|day)/);
        
        if (match.provider.offersDelivery) {
          expect(match.estimatedDeliveryTime).toMatch(/hours?/);
        }
      });
    });

    it('should handle empty provider list gracefully', async () => {
      mockProviderService.searchProviders.mockResolvedValue([]);

      const result = await providerMatchingService.findMatchingProviders(baseCriteria);

      expect(result).toHaveLength(0);
    });
  });

  describe('getProviderRecommendations', () => {
    it('should get recommendations for a specific order', async () => {
      const mockOrder = createMockOrder({
        type: OrderType.PHARMACY,
      });
      mockOrderService.getOrderWithDetails.mockResolvedValue(mockOrder);

      const result = await providerMatchingService.getProviderRecommendations('order-123', 3);

      expect(mockOrderService.getOrderWithDetails).toHaveBeenCalledWith('order-123');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(
        expect.objectContaining({
          provider: expect.any(Object),
          matchScore: expect.any(Number),
        })
      );
    });

    it('should limit results to specified number', async () => {
      const result = await providerMatchingService.getProviderRecommendations('order-123', 2);

      expect(result).toHaveLength(2);
    });
  });

  describe('getMatchingStatistics', () => {
    it('should return matching statistics', async () => {
      const result = await providerMatchingService.getMatchingStatistics();

      expect(result).toEqual({
        totalProviders: expect.any(Number),
        activeProviders: expect.any(Number),
        averageMatchScore: expect.any(Number),
        topPerformingProviders: expect.any(Array),
      });

      expect(mockProviderService.count).toHaveBeenCalledTimes(2);
      expect(mockProviderService.getTopRatedProviders).toHaveBeenCalledWith(10);
    });
  });

  describe('location scoring', () => {
    it('should give higher scores for same city providers', async () => {
      const sameCityCriteria: MatchingCriteria = {
        orderType: OrderType.PHARMACY,
        patientLocation: 'Test City, TS',
      };

      const result = await providerMatchingService.findMatchingProviders(sameCityCriteria);

      // Providers in Test City should have higher location scores than Suburb City
      const testCityProvider = result.find(r => r.provider.address.includes('Test City'));
      const suburbProvider = result.find(r => r.provider.address.includes('Suburb City'));
      
      if (testCityProvider && suburbProvider) {
        expect(testCityProvider.matchFactors.locationScore)
          .toBeGreaterThan(suburbProvider.matchFactors.locationScore);
      }
    });

    it('should handle missing patient location gracefully', async () => {
      const noCriteria: MatchingCriteria = {
        orderType: OrderType.PHARMACY,
      };

      const result = await providerMatchingService.findMatchingProviders(noCriteria);

      expect(result).toHaveLength(3);
      result.forEach(match => {
        expect(match.matchFactors.locationScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('quality scoring', () => {
    it('should score providers based on ratings and quality metrics', async () => {
      const result = await providerMatchingService.findMatchingProviders(baseCriteria);

      // Higher rated provider should have higher quality score
      const highRatedProvider = result.find(r => r.provider.averageRating === 4.8);
      const lowerRatedProvider = result.find(r => r.provider.averageRating === 4.2);
      
      if (highRatedProvider && lowerRatedProvider) {
        expect(highRatedProvider.matchFactors.qualityScore)
          .toBeGreaterThan(lowerRatedProvider.matchFactors.qualityScore);
      }
    });
  });
});
