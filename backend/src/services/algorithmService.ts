import { BidDetails, AlgorithmFactorWeights, MarketOrder } from '../types';

/**
 * Evaluates a list of bids for a given order based on configured algorithm factors.
 * Returns the winning bid or null if no suitable bid is found.
 */
export const evaluateBids = async (
  order: MarketOrder, // The order context might be needed for specific constraints
  bids: BidDetails[],
  factors: AlgorithmFactorWeights
): Promise<BidDetails | null> => {
  console.log(`algorithmService: Evaluating ${bids.length} bids for order ${order.id} using factors:`, factors);

  if (!bids || bids.length === 0) {
    console.log('algorithmService: No bids to evaluate.');
    return null;
  }

  const scoredBids = bids.map(bid => {
    let score = 0;

    // Normalize and score price (lower is better)
    // This normalization needs a reference range (e.g., min/max bid, or expected market price)
    // Simplified: Assume lower bidAmount is linearly better. Needs more robust normalization.
    const priceScore = bid.bidAmount > 0 ? (1 / bid.bidAmount) * 100 : 0; // Example, needs refinement
    score += priceScore * factors.priceWeight;

    // Normalize and score speed (lower time is better)
    let speedNumeric = 999; // Default for less desirable/unknown
    if (order.orderType === 'PHARMACY_PRESCRIPTION' && bid.estimatedDeliveryTime) {
        if (bid.estimatedDeliveryTime.includes("HOUR")) speedNumeric = 4; // Arbitrary scale
        else if (bid.estimatedDeliveryTime.includes("ASAP")) speedNumeric = 3;
        else if (bid.estimatedDeliveryTime.includes("TODAY")) speedNumeric = 2;
        else if (bid.estimatedDeliveryTime.includes("TOMORROW")) speedNumeric = 1;
        else if (bid.estimatedDeliveryTime.includes("PICKUP")) speedNumeric = 0.5; // Pickup can be fast
        else speedNumeric = 0; // "2-3 days"
    } else if (order.orderType === 'LAB_TEST_REQUEST' && bid.estimatedTurnaroundTimeForResultsHours) {
        speedNumeric = bid.estimatedTurnaroundTimeForResultsHours;
    }
    // Simplified: inverse of time. Higher speedNumeric from above mapping (pharmacy) or lower hours (lab) is better.
    // This needs careful, consistent normalization. Example below is very basic.
    const speedScore = speedNumeric > 0 ? (order.orderType === 'PHARMACY_PRESCRIPTION' ? speedNumeric : 1 / speedNumeric * 10) : 0;
    score += speedScore * factors.speedWeight;
    

    // Normalize and score quality (higher is better)
    const qualityRating = bid.providerMetricsSnapshot?.overallRating || 3; // Default to 3 out of 5
    const qualitySla = bid.providerMetricsSnapshot?.slaCompliance || 70; // Default to 70%
    const qualityScore = (qualityRating / 5) * 0.7 + (qualitySla / 100) * 0.3; // Weighted quality components
    score += qualityScore * factors.qualityWeight;

    // TODO: Add proximity scoring if factors.proximityWeight is used (needs patient & provider locations)

    console.log(`algorithmService: Bid ${bid.id} from ${bid.providerName} - Price: ${bid.bidAmount}, SpeedVal: ${speedNumeric}, Quality: ${qualityRating}/${qualitySla} -> Score: ${score.toFixed(3)}`);
    return { ...bid, calculatedScore: score };
  });

  // Sort by score descending
  scoredBids.sort((a, b) => (b.calculatedScore || 0) - (a.calculatedScore || 0));

  const winningBid = scoredBids[0];
  console.log(`algorithmService: Winning bid is ${winningBid?.id} with score ${winningBid?.calculatedScore?.toFixed(3)}`);
  
  return winningBid || null;
};

// Placeholder for fetching current algorithm factors (could be from DB or a config file)
export const getCurrentAlgorithmFactors = async (orderType: MarketOrder['orderType']): Promise<AlgorithmFactorWeights> => {
    // In a real app, this would fetch from a persistent configuration store
    console.warn(`algorithmService: getCurrentAlgorithmFactors for ${orderType} is returning mock data.`);
    if (orderType === 'PHARMACY_PRESCRIPTION') {
        return { priceWeight: 0.6, speedWeight: 0.2, qualityWeight: 0.2 };
    } else { // LAB_TEST_REQUEST
        return { priceWeight: 0.5, speedWeight: 0.3, qualityWeight: 0.2 };
    }
};
