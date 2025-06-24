import { FindOptions, Op } from 'sequelize';
import Order, {
  OrderAttributes,
  OrderCreationAttributes,
  OrderType,
  OrderStatus
} from '../models/Order';
import Patient from '../models/Patient';
import Provider from '../models/Provider';
import Bid from '../models/Bid';
import { BaseService, NotFoundError } from './BaseService';
import { validateSchema, orderSchemas, ValidationError } from '../utils/validation';

// Order update attributes
export interface OrderUpdateAttributes {
  status?: OrderStatus;
  assignedProviderId?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: Date;
  pickupLocation?: string;
  trackingLink?: string;
  preTestInstructions?: string;
  sampleCollectionInfo?: string;
  resultsPdfUrl?: string;
  resultSummaryForDoctor?: string;
  totalAmount?: number;
  paymentStatus?: string;
  patientNotes?: string;
  providerNotes?: string;
  internalNotes?: string;
}

// Status update data
export interface StatusUpdateData {
  status: OrderStatus;
  notes?: string;
}

// Order assignment data
export interface OrderAssignmentData {
  providerId: string;
  notes?: string;
}

// Order search criteria
export interface OrderSearchCriteria {
  patientId?: string;
  type?: OrderType;
  status?: OrderStatus;
  assignedProviderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export class OrderService extends BaseService<Order, OrderCreationAttributes, OrderUpdateAttributes> {
  constructor() {
    super(Order, 'Order');
  }

  /**
   * Create a new order with validation
   */
  async create(data: OrderCreationAttributes): Promise<Order> {
    const validatedData = validateSchema(orderSchemas.create, data);
    
    // Verify patient exists
    const patient = await Patient.findByPk(validatedData.patientId);
    if (!patient) {
      throw new NotFoundError('Patient', validatedData.patientId);
    }

    return super.create(validatedData);
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, statusData: StatusUpdateData): Promise<Order> {
    const validatedData = validateSchema(orderSchemas.updateStatus, statusData);
    
    const order = await this.findById(id);
    
    // Validate status transition
    this.validateStatusTransition(order.status, validatedData.status);
    
    // Update status using the model method
    order.updateStatus(validatedData.status, validatedData.notes);
    await order.save();
    
    return order;
  }

  /**
   * Assign order to provider
   */
  async assignToProvider(id: string, assignmentData: OrderAssignmentData): Promise<Order> {
    const validatedData = validateSchema(orderSchemas.assign, assignmentData);
    
    const order = await this.findById(id);
    
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
    if ((order.type === OrderType.PHARMACY && provider.type !== 'pharmacy') ||
        (order.type === OrderType.LAB && provider.type !== 'lab')) {
      throw new ValidationError('Provider type mismatch', [
        { field: 'providerId', message: `Provider cannot handle ${order.type} orders` }
      ]);
    }
    
    // Assign order using model method
    order.assignToProvider(validatedData.providerId);
    if (validatedData.notes) {
      order.internalNotes = order.internalNotes ? 
        `${order.internalNotes}\n[${new Date().toISOString()}] ${validatedData.notes}` : 
        `[${new Date().toISOString()}] ${validatedData.notes}`;
    }
    
    await order.save();
    return order;
  }

  /**
   * Search orders by criteria
   */
  async searchOrders(criteria: OrderSearchCriteria, options: FindOptions = {}): Promise<Order[]> {
    const whereConditions: any = {};

    if (criteria.patientId) {
      whereConditions.patientId = criteria.patientId;
    }

    if (criteria.type) {
      whereConditions.type = criteria.type;
    }

    if (criteria.status) {
      whereConditions.status = criteria.status;
    }

    if (criteria.assignedProviderId) {
      whereConditions.assignedProviderId = criteria.assignedProviderId;
    }

    if (criteria.dateFrom || criteria.dateTo) {
      whereConditions.orderDate = {};
      if (criteria.dateFrom) {
        whereConditions.orderDate[Op.gte] = criteria.dateFrom;
      }
      if (criteria.dateTo) {
        whereConditions.orderDate[Op.lte] = criteria.dateTo;
      }
    }

    if (criteria.minAmount || criteria.maxAmount) {
      whereConditions.totalAmount = {};
      if (criteria.minAmount) {
        whereConditions.totalAmount[Op.gte] = criteria.minAmount;
      }
      if (criteria.maxAmount) {
        whereConditions.totalAmount[Op.lte] = criteria.maxAmount;
      }
    }

    return this.findAll({
      ...options,
      where: { ...options.where, ...whereConditions },
      order: [['orderDate', 'DESC']],
    });
  }

  /**
   * Get orders by patient
   */
  async getPatientOrders(patientId: string, options: FindOptions = {}): Promise<Order[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, patientId },
      order: [['orderDate', 'DESC']],
    });
  }

  /**
   * Get orders by provider
   */
  async getProviderOrders(providerId: string, options: FindOptions = {}): Promise<Order[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, assignedProviderId: providerId },
      order: [['orderDate', 'DESC']],
    });
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus, options: FindOptions = {}): Promise<Order[]> {
    return this.findAll({
      ...options,
      where: { ...options.where, status },
      order: [['orderDate', 'ASC']],
    });
  }

  /**
   * Get active orders
   */
  async getActiveOrders(options: FindOptions = {}): Promise<Order[]> {
    return this.findAll({
      ...options,
      where: {
        ...options.where,
        status: { 
          [Op.notIn]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] 
        },
      },
      order: [['orderDate', 'ASC']],
    });
  }

  /**
   * Get orders awaiting bids
   */
  async getOrdersAwaitingBids(): Promise<Order[]> {
    return this.getOrdersByStatus(OrderStatus.AWAITING_BIDS);
  }

  /**
   * Get unassigned orders
   */
  async getUnassignedOrders(): Promise<Order[]> {
    return this.findAll({
      where: {
        assignedProviderId: null,
        status: { 
          [Op.in]: [OrderStatus.PENDING_BROADCAST, OrderStatus.AWAITING_BIDS, OrderStatus.BIDS_RECEIVED] 
        },
      },
      order: [['orderDate', 'ASC']],
    });
  }

  /**
   * Get order with full details
   */
  async getOrderWithDetails(id: string): Promise<Order> {
    return this.findById(id, {
      include: [
        { model: Patient, as: 'patient', include: [{ association: 'user' }] },
        { model: Provider, as: 'assignedProvider' },
        { model: Bid, as: 'bids', include: [{ model: Provider, as: 'provider' }] },
      ],
    });
  }

  /**
   * Complete order
   */
  async completeOrder(id: string, completionData?: { 
    actualDeliveryTime?: Date;
    resultsPdfUrl?: string;
    resultSummaryForDoctor?: string;
    notes?: string;
  }): Promise<Order> {
    const order = await this.findById(id);
    
    const updateData: any = { status: OrderStatus.COMPLETED };
    
    if (completionData) {
      if (completionData.actualDeliveryTime) {
        updateData.actualDeliveryTime = completionData.actualDeliveryTime;
      }
      if (completionData.resultsPdfUrl) {
        updateData.resultsPdfUrl = completionData.resultsPdfUrl;
      }
      if (completionData.resultSummaryForDoctor) {
        updateData.resultSummaryForDoctor = completionData.resultSummaryForDoctor;
      }
    }
    
    order.updateStatus(OrderStatus.COMPLETED, completionData?.notes);
    await order.update(updateData);
    
    return order;
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const order = await this.findById(id);
    
    // Can only cancel orders that haven't been completed
    if (order.status === OrderStatus.COMPLETED) {
      throw new ValidationError('Cannot cancel completed order', [
        { field: 'status', message: 'Order has already been completed' }
      ]);
    }
    
    order.updateStatus(OrderStatus.CANCELLED, reason);
    await order.save();
    
    return order;
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(): Promise<{
    total: number;
    byStatus: { [key in OrderStatus]: number };
    byType: { [key in OrderType]: number };
    averageOrderValue: number;
    completionRate: number;
  }> {
    const total = await this.count();
    
    // Status statistics
    const byStatus = {} as { [key in OrderStatus]: number };
    for (const status of Object.values(OrderStatus)) {
      byStatus[status] = await this.count({ where: { status } });
    }

    // Type statistics
    const byType = {} as { [key in OrderType]: number };
    for (const type of Object.values(OrderType)) {
      byType[type] = await this.count({ where: { type } });
    }

    // Calculate average order value
    const ordersWithAmount = await this.findAll({
      where: { totalAmount: { [Op.not]: null } },
    });
    
    const totalValue = ordersWithAmount.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = ordersWithAmount.length > 0 ? totalValue / ordersWithAmount.length : 0;

    // Calculate completion rate
    const completedOrders = byStatus[OrderStatus.COMPLETED];
    const totalProcessedOrders = completedOrders + byStatus[OrderStatus.CANCELLED];
    const completionRate = totalProcessedOrders > 0 ? (completedOrders / totalProcessedOrders) * 100 : 0;

    return {
      total,
      byStatus,
      byType,
      averageOrderValue,
      completionRate,
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: { [key in OrderStatus]: OrderStatus[] } = {
      [OrderStatus.PENDING_BROADCAST]: [OrderStatus.AWAITING_BIDS, OrderStatus.CANCELLED],
      [OrderStatus.AWAITING_BIDS]: [OrderStatus.BIDS_RECEIVED, OrderStatus.CANCELLED],
      [OrderStatus.BIDS_RECEIVED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      [OrderStatus.ASSIGNED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [], // No transitions from completed
      [OrderStatus.CANCELLED]: [], // No transitions from cancelled
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
}
