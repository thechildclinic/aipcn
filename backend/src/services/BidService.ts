import { FindOptions, Op } from 'sequelize';
import Bid, {
  BidAttributes,
  BidCreationAttributes,
  BidStatus
} from '../models/Bid';
import Order, { OrderStatus } from '../models/Order';
import Provider from '../models/Provider';
import { BaseService, NotFoundError } from './BaseService';
import { validateSchema, bidSchemas, ValidationError } from '../utils/validation';

// Bid update attributes
export interface BidUpdateAttributes {
  bidAmount?: number;
  estimatedDeliveryTime?: string;
  estimatedTurnaroundTime?: string;
  notes?: string;
  validUntil?: Date;
}

// Bid response data
export interface BidResponseData {
  status: 'accepted' | 'rejected';
  notes?: string;
}

// Bid search criteria
export interface BidSearchCriteria {
  orderId?: string;
  providerId?: string;
  status?: BidStatus;
  minAmount?: number;
  maxAmount?: number;
  submittedAfter?: Date;
  submittedBefore?: Date;
}

export class BidService extends BaseService<Bid, BidCreationAttributes, BidUpdateAttributes> {
  constructor() {
    super(Bid, 'Bid');
  }

  /**
   * Create a new bid with validation
   */
  async create(data: BidCreationAttributes): Promise<Bid> {
    const validatedData = validateSchema(bidSchemas.create, data);
    
    // Verify order exists and can receive bids
    const order = await Order.findByPk(validatedData.orderId);
    if (!order) {
      throw new NotFoundError('Order', validatedData.orderId);
    }
    
    if (!order.canReceiveBids()) {
      throw new ValidationError('Order cannot receive bids', [
        { field: 'orderId', message: `Order status ${order.status} does not allow new bids` }
      ]);
    }
    
    // Verify provider exists and is available
    const provider = await Provider.findByPk(validatedData.providerId);
    if (!provider) {
      throw new NotFoundError('Provider', validatedData.providerId);
    }
    
    if (!provider.isAvailable()) {
      throw new ValidationError('Provider not available', [
        { field: 'providerId', message: 'Provider is not currently accepting new orders' }
      ]);
    }
    
    // Check if provider can handle this order type
    if ((order.type === 'pharmacy' && provider.type !== 'pharmacy') ||
        (order.type === 'lab' && provider.type !== 'lab')) {
      throw new ValidationError('Provider type mismatch', [
        { field: 'providerId', message: `Provider cannot handle ${order.type} orders` }
      ]);
    }
    
    // Check if provider already has a bid for this order
    const existingBid = await this.findOne({ 
      where: { 
        orderId: validatedData.orderId, 
        providerId: validatedData.providerId 
      } 
    });
    
    if (existingBid) {
      throw new ValidationError('Bid already exists', [
        { field: 'providerId', message: 'Provider has already submitted a bid for this order' }
      ]);
    }

    const bid = await super.create(validatedData);
    
    // Update order status if this is the first bid
    const bidCount = await this.count({ where: { orderId: validatedData.orderId } });
    if (bidCount === 1 && order.status === OrderStatus.AWAITING_BIDS) {
      order.updateStatus(OrderStatus.BIDS_RECEIVED);
      await order.save();
    }
    
    return bid;
  }

  /**
   * Update bid (only allowed for submitted bids)
   */
  async update(id: string, data: BidUpdateAttributes): Promise<Bid> {
    const bid = await this.findById(id);
    
    if (bid.status !== BidStatus.SUBMITTED) {
      throw new ValidationError('Cannot update bid', [
        { field: 'status', message: 'Only submitted bids can be updated' }
      ]);
    }
    
    if (!bid.isValid()) {
      throw new ValidationError('Bid expired', [
        { field: 'validUntil', message: 'Cannot update expired bid' }
      ]);
    }
    
    return super.update(id, data);
  }

  /**
   * Respond to bid (accept or reject)
   */
  async respondToBid(id: string, responseData: BidResponseData): Promise<Bid> {
    const validatedData = validateSchema(bidSchemas.respond, responseData);
    
    const bid = await this.findById(id, {
      include: [
        { model: Order, as: 'order' },
        { model: Provider, as: 'provider' },
      ],
    });
    
    if (bid.status !== BidStatus.SUBMITTED) {
      throw new ValidationError('Cannot respond to bid', [
        { field: 'status', message: 'Bid has already been responded to' }
      ]);
    }
    
    if (!bid.isValid()) {
      throw new ValidationError('Bid expired', [
        { field: 'validUntil', message: 'Cannot respond to expired bid' }
      ]);
    }
    
    const order = (bid as any).order;
    if (!order) {
      throw new NotFoundError('Order', 'associated with bid');
    }
    
    if (validatedData.status === 'accepted') {
      // Accept the bid
      bid.accept();
      
      // Assign order to provider
      order.assignToProvider(bid.providerId);
      await order.save();
      
      // Reject all other bids for this order
      await Bid.update(
        { status: BidStatus.REJECTED },
        {
          where: {
            orderId: bid.orderId,
            id: { [Op.ne]: bid.id },
            status: BidStatus.SUBMITTED
          }
        }
      );
    } else {
      // Reject the bid
      bid.reject();
    }
    
    if (validatedData.notes) {
      bid.notes = bid.notes ? 
        `${bid.notes}\n[Response] ${validatedData.notes}` : 
        `[Response] ${validatedData.notes}`;
    }
    
    await bid.save();
    return bid;
  }

  /**
   * Search bids by criteria
   */
  async searchBids(criteria: BidSearchCriteria, options: FindOptions = {}): Promise<Bid[]> {
    const whereConditions: any = {};

    if (criteria.orderId) {
      whereConditions.orderId = criteria.orderId;
    }

    if (criteria.providerId) {
      whereConditions.providerId = criteria.providerId;
    }

    if (criteria.status) {
      whereConditions.status = criteria.status;
    }

    if (criteria.minAmount || criteria.maxAmount) {
      whereConditions.bidAmount = {};
      if (criteria.minAmount) {
        whereConditions.bidAmount[Op.gte] = criteria.minAmount;
      }
      if (criteria.maxAmount) {
        whereConditions.bidAmount[Op.lte] = criteria.maxAmount;
      }
    }

    if (criteria.submittedAfter || criteria.submittedBefore) {
      whereConditions.submittedAt = {};
      if (criteria.submittedAfter) {
        whereConditions.submittedAt[Op.gte] = criteria.submittedAfter;
      }
      if (criteria.submittedBefore) {
        whereConditions.submittedAt[Op.lte] = criteria.submittedBefore;
      }
    }

    return this.findAll({
      ...options,
      where: { ...options.where, ...whereConditions },
      order: [['submittedAt', 'DESC']],
    });
  }

  /**
   * Get bids for an order
   */
  async getOrderBids(orderId: string, options: FindOptions = {}): Promise<Bid[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, orderId },
      include: [{ model: Provider, as: 'provider' }],
      order: [['bidAmount', 'ASC']],
    });
  }

  /**
   * Get bids by provider
   */
  async getProviderBids(providerId: string, options: FindOptions = {}): Promise<Bid[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, providerId },
      include: [{ model: Order, as: 'order' }],
      order: [['submittedAt', 'DESC']],
    });
  }

  /**
   * Get active bids (submitted and valid)
   */
  async getActiveBids(options: FindOptions = {}): Promise<Bid[]> {
    return this.findAll({
      ...options,
      where: {
        ...options.where,
        status: BidStatus.SUBMITTED,
        [Op.or]: [
          { validUntil: null },
          { validUntil: { [Op.gt]: new Date() } },
        ],
      },
      order: [['submittedAt', 'ASC']],
    });
  }

  /**
   * Get expired bids
   */
  async getExpiredBids(): Promise<Bid[]> {
    return this.findAll({
      where: {
        status: BidStatus.SUBMITTED,
        validUntil: { [Op.lt]: new Date() },
      },
    });
  }

  /**
   * Expire old bids
   */
  async expireOldBids(): Promise<number> {
    const expiredBids = await this.getExpiredBids();
    
    for (const bid of expiredBids) {
      bid.expire();
      await bid.save();
    }
    
    return expiredBids.length;
  }

  /**
   * Get bid statistics
   */
  async getBidStatistics(): Promise<{
    total: number;
    byStatus: { [key in BidStatus]: number };
    averageBidAmount: number;
    acceptanceRate: number;
    averageResponseTime: number; // in hours
  }> {
    const total = await this.count();
    
    // Status statistics
    const byStatus = {} as { [key in BidStatus]: number };
    for (const status of Object.values(BidStatus)) {
      byStatus[status] = await this.count({ where: { status } });
    }

    // Calculate average bid amount
    const bids = await this.findAll({
      where: { bidAmount: { [Op.not]: null } },
    });
    
    const totalAmount = bids.reduce((sum, bid) => sum + bid.bidAmount, 0);
    const averageBidAmount = bids.length > 0 ? totalAmount / bids.length : 0;

    // Calculate acceptance rate
    const respondedBids = byStatus[BidStatus.ACCEPTED] + byStatus[BidStatus.REJECTED];
    const acceptanceRate = respondedBids > 0 ? (byStatus[BidStatus.ACCEPTED] / respondedBids) * 100 : 0;

    // Calculate average response time
    const respondedBidsWithTimes = await this.findAll({
      where: {
        status: { [Op.in]: [BidStatus.ACCEPTED, BidStatus.REJECTED] },
        respondedAt: { [Op.not]: null },
      },
    });
    
    const totalResponseTime = respondedBidsWithTimes.reduce((sum, bid) => {
      const responseTime = bid.respondedAt!.getTime() - bid.submittedAt.getTime();
      return sum + (responseTime / (1000 * 60 * 60)); // Convert to hours
    }, 0);
    
    const averageResponseTime = respondedBidsWithTimes.length > 0 ? 
      totalResponseTime / respondedBidsWithTimes.length : 0;

    return {
      total,
      byStatus,
      averageBidAmount,
      acceptanceRate,
      averageResponseTime,
    };
  }

  /**
   * Get best bids for an order (sorted by quality score)
   */
  async getBestBidsForOrder(orderId: string, limit: number = 5): Promise<Bid[]> {
    const bids = await this.getOrderBids(orderId, {
      where: { status: BidStatus.SUBMITTED },
    });
    
    // Calculate quality scores and sort
    const bidsWithScores = bids.map(bid => ({
      bid,
      qualityScore: bid.getQualityScore(),
    }));
    
    bidsWithScores.sort((a, b) => b.qualityScore - a.qualityScore);
    
    return bidsWithScores.slice(0, limit).map(item => item.bid);
  }

  /**
   * Get bid with full details
   */
  async getBidWithDetails(id: string): Promise<Bid> {
    return this.findById(id, {
      include: [
        { model: Order, as: 'order', include: [{ association: 'patient' }] },
        { model: Provider, as: 'provider' },
      ],
    });
  }

  /**
   * Withdraw bid (provider cancels their own bid)
   */
  async withdrawBid(id: string, providerId: string): Promise<Bid> {
    const bid = await this.findById(id);
    
    if (bid.providerId !== providerId) {
      throw new ValidationError('Unauthorized', [
        { field: 'providerId', message: 'Can only withdraw your own bids' }
      ]);
    }
    
    if (bid.status !== BidStatus.SUBMITTED) {
      throw new ValidationError('Cannot withdraw bid', [
        { field: 'status', message: 'Can only withdraw submitted bids' }
      ]);
    }
    
    await this.delete(id);
    return bid;
  }
}
