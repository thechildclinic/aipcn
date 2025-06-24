import { providerService, orderService } from './index';
import { OrderType } from '../models/Order';
import { ProviderType } from '../models/Provider';

export interface MatchingCriteria {
  orderType: OrderType;
  patientLocation?: string;
  requiredServices?: string[];
  requiredTests?: string[];
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  maxDistance?: number;
  minRating?: number;
  maxPrice?: number;
  insuranceAccepted?: string[];
}

export interface ProviderMatch {
  provider: any;
  matchScore: number;
  matchFactors: {
    locationScore: number;
    serviceScore: number;
    qualityScore: number;
    availabilityScore: number;
    priceScore: number;
  };
  estimatedDistance?: number;
  estimatedDeliveryTime?: string;
}

export class ProviderMatchingService {
  /**
   * Find and rank providers based on matching criteria
   */
  async findMatchingProviders(criteria: MatchingCriteria): Promise<ProviderMatch[]> {
    // Get base provider list
    const providerType = criteria.orderType === OrderType.PHARMACY ? 
      ProviderType.PHARMACY : ProviderType.LAB;

    const baseProviders = await providerService.searchProviders({
      type: providerType,
      isActive: true,
      acceptingNewOrders: true,
      minRating: criteria.minRating || 3.0,
      servicesOffered: criteria.requiredServices,
      testsOffered: criteria.requiredTests,
    });

    // Score and rank each provider
    const scoredProviders = await Promise.all(
      baseProviders.map(async (provider) => {
        const matchScore = await this.calculateMatchScore(provider, criteria);
        return {
          provider,
          matchScore: matchScore.totalScore,
          matchFactors: matchScore.factors,
          estimatedDistance: this.calculateDistance(provider, criteria.patientLocation),
          estimatedDeliveryTime: this.estimateDeliveryTime(provider, criteria),
        };
      })
    );

    // Sort by match score (highest first)
    return scoredProviders.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate comprehensive match score for a provider
   */
  private async calculateMatchScore(provider: any, criteria: MatchingCriteria): Promise<{
    totalScore: number;
    factors: {
      locationScore: number;
      serviceScore: number;
      qualityScore: number;
      availabilityScore: number;
      priceScore: number;
    };
  }> {
    // Location score (0-100)
    const locationScore = this.calculateLocationScore(provider, criteria.patientLocation, criteria.maxDistance);
    
    // Service capability score (0-100)
    const serviceScore = this.calculateServiceScore(provider, criteria);
    
    // Quality score (0-100)
    const qualityScore = this.calculateQualityScore(provider);
    
    // Availability score (0-100)
    const availabilityScore = this.calculateAvailabilityScore(provider);
    
    // Price competitiveness score (0-100)
    const priceScore = await this.calculatePriceScore(provider, criteria);

    // Weighted total score
    const weights = this.getWeights(criteria.urgency);
    const totalScore = 
      (locationScore * weights.location) +
      (serviceScore * weights.service) +
      (qualityScore * weights.quality) +
      (availabilityScore * weights.availability) +
      (priceScore * weights.price);

    return {
      totalScore,
      factors: {
        locationScore,
        serviceScore,
        qualityScore,
        availabilityScore,
        priceScore,
      },
    };
  }

  /**
   * Calculate location-based score
   */
  private calculateLocationScore(provider: any, patientLocation?: string, maxDistance?: number): number {
    if (!patientLocation) return 50; // Neutral score if no location provided

    const distance = this.calculateDistance(provider, patientLocation);
    
    if (maxDistance && distance > maxDistance) {
      return 0; // Outside acceptable range
    }

    // Score decreases with distance
    const maxReasonableDistance = maxDistance || 50; // 50 miles default
    const score = Math.max(0, 100 - (distance / maxReasonableDistance) * 100);
    
    return Math.min(100, score);
  }

  /**
   * Calculate service capability score
   */
  private calculateServiceScore(provider: any, criteria: MatchingCriteria): number {
    let score = 100; // Start with perfect score

    // Check required services
    if (criteria.requiredServices && criteria.requiredServices.length > 0) {
      const providerServices = provider.servicesOffered || [];
      const matchedServices = criteria.requiredServices.filter(service =>
        providerServices.some((ps: string) => ps.toLowerCase().includes(service.toLowerCase()))
      );
      
      const serviceMatchRatio = matchedServices.length / criteria.requiredServices.length;
      score *= serviceMatchRatio;
    }

    // Check required tests (for labs)
    if (criteria.requiredTests && criteria.requiredTests.length > 0) {
      const providerTests = provider.testsOffered || [];
      const matchedTests = criteria.requiredTests.filter(test =>
        providerTests.some((pt: string) => pt.toLowerCase().includes(test.toLowerCase()))
      );
      
      const testMatchRatio = matchedTests.length / criteria.requiredTests.length;
      score *= testMatchRatio;
    }

    // Bonus for additional capabilities
    const totalCapabilities = (provider.servicesOffered?.length || 0) + (provider.testsOffered?.length || 0);
    const capabilityBonus = Math.min(20, totalCapabilities * 2); // Up to 20 bonus points
    
    return Math.min(100, score + capabilityBonus);
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(provider: any): number {
    let score = 0;
    let factors = 0;

    // Rating score (0-5 scale to 0-100)
    if (provider.averageRating) {
      score += (provider.averageRating / 5) * 40; // 40% weight
      factors++;
    }

    // SLA compliance score
    if (provider.slaCompliance) {
      score += (provider.slaCompliance / 100) * 30; // 30% weight
      factors++;
    }

    // Quality score (letter grade to numeric)
    if (provider.qualityScore) {
      const qualityMap: { [key: string]: number } = {
        'A+': 100, 'A': 90, 'B+': 80, 'B': 70, 'C+': 60, 'C': 50, 'D': 30, 'F': 10
      };
      const qualityValue = qualityMap[provider.qualityScore] || 50;
      score += (qualityValue / 100) * 30; // 30% weight
      factors++;
    }

    return factors > 0 ? score / factors : 50; // Default to 50 if no quality metrics
  }

  /**
   * Calculate availability score
   */
  private calculateAvailabilityScore(provider: any): number {
    let score = 100;

    // Check if accepting new orders
    if (!provider.acceptingNewOrders) {
      return 0;
    }

    // Capacity utilization
    if (provider.currentCapacity && provider.maxCapacity) {
      const utilizationRate = provider.currentCapacity / provider.maxCapacity;
      
      if (utilizationRate >= 1.0) {
        return 0; // At full capacity
      } else if (utilizationRate >= 0.9) {
        score *= 0.5; // Heavily penalize near-full capacity
      } else if (utilizationRate >= 0.7) {
        score *= 0.8; // Moderately penalize high utilization
      }
    }

    // Response time bonus (for labs)
    if (provider.avgTurnaroundTimeHours) {
      const responseBonus = Math.max(0, 20 - (provider.avgTurnaroundTimeHours / 24) * 20);
      score += responseBonus;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate price competitiveness score
   */
  private async calculatePriceScore(provider: any, criteria: MatchingCriteria): Promise<number> {
    // This would typically involve historical pricing data
    // For now, we'll use a simplified approach based on provider type and region
    
    let score = 75; // Default competitive score

    // Adjust based on provider characteristics
    if (provider.offersDelivery && criteria.orderType === OrderType.PHARMACY) {
      score += 10; // Bonus for delivery capability
    }

    // Adjust based on max price criteria
    if (criteria.maxPrice) {
      // This would need historical pricing data to be accurate
      // For now, assume providers are generally within range
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate distance between provider and patient location
   */
  private calculateDistance(provider: any, patientLocation?: string): number {
    if (!patientLocation) return 25; // Default distance

    // This is a simplified distance calculation
    // In a real implementation, you would use a geocoding service
    
    // Extract city/state from addresses for basic comparison
    const providerLocation = provider.address?.toLowerCase() || '';
    const patientLoc = patientLocation.toLowerCase();
    
    // Same city bonus
    if (providerLocation.includes(patientLoc.split(',')[0]?.trim() || '')) {
      return Math.random() * 10; // 0-10 miles within same city
    }
    
    // Same state
    if (providerLocation.includes(patientLoc.split(',').pop()?.trim() || '')) {
      return 10 + Math.random() * 40; // 10-50 miles within same state
    }
    
    // Different state
    return 50 + Math.random() * 100; // 50-150 miles different state
  }

  /**
   * Estimate delivery time based on provider and criteria
   */
  private estimateDeliveryTime(provider: any, criteria: MatchingCriteria): string {
    if (criteria.orderType === OrderType.PHARMACY) {
      if (provider.offersDelivery) {
        switch (criteria.urgency) {
          case 'emergency': return '1-2 hours';
          case 'high': return '2-4 hours';
          case 'medium': return '4-8 hours';
          default: return 'Same day';
        }
      } else {
        return 'Ready for pickup in 2-4 hours';
      }
    } else {
      // Lab orders
      const baseTurnaround = provider.avgTurnaroundTimeHours || 24;
      switch (criteria.urgency) {
        case 'emergency': return `${Math.max(2, baseTurnaround / 2)} hours`;
        case 'high': return `${Math.max(4, baseTurnaround * 0.75)} hours`;
        case 'medium': return `${baseTurnaround} hours`;
        default: return `${baseTurnaround * 1.2} hours`;
      }
    }
  }

  /**
   * Get scoring weights based on urgency
   */
  private getWeights(urgency?: string): {
    location: number;
    service: number;
    quality: number;
    availability: number;
    price: number;
  } {
    switch (urgency) {
      case 'emergency':
        return { location: 0.4, service: 0.3, quality: 0.1, availability: 0.2, price: 0.0 };
      case 'high':
        return { location: 0.3, service: 0.25, quality: 0.15, availability: 0.25, price: 0.05 };
      case 'medium':
        return { location: 0.2, service: 0.2, quality: 0.2, availability: 0.2, price: 0.2 };
      default: // low urgency
        return { location: 0.15, service: 0.2, quality: 0.25, availability: 0.15, price: 0.25 };
    }
  }

  /**
   * Get provider recommendations for a specific order
   */
  async getProviderRecommendations(orderId: string, limit: number = 5): Promise<ProviderMatch[]> {
    const order = await orderService.getOrderWithDetails(orderId);
    
    const criteria: MatchingCriteria = {
      orderType: order.type,
      patientLocation: 'default', // Would get from patient data in real implementation
      urgency: 'medium', // Default urgency
    };

    // Extract required services/tests from order data
    if (order.type === OrderType.PHARMACY && order.prescriptionData) {
      criteria.requiredServices = ['Prescription Dispensing'];
    } else if (order.type === OrderType.LAB && order.testData) {
      criteria.requiredTests = ['Blood Work', 'Lab Testing']; // Simplified
    }

    const matches = await this.findMatchingProviders(criteria);
    return matches.slice(0, limit);
  }

  /**
   * Get matching statistics
   */
  async getMatchingStatistics(): Promise<{
    totalProviders: number;
    activeProviders: number;
    averageMatchScore: number;
    topPerformingProviders: any[];
  }> {
    const totalProviders = await providerService.count();
    const activeProviders = await providerService.count({ where: { isActive: true } });
    
    // Get top performing providers
    const topProviders = await providerService.getTopRatedProviders(10);
    
    return {
      totalProviders,
      activeProviders,
      averageMatchScore: 75.5, // Mock average
      topPerformingProviders: topProviders,
    };
  }
}
