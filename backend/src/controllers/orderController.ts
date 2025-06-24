import { Request, Response } from 'express';
import { orderService, bidService } from '../services';
import { OrderType, OrderStatus } from '../models/Order';
import { validateSchema, orderSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

export class OrderController {
  /**
   * Create a new order
   */
  createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const orderData = validateSchema(orderSchemas.create, req.body);

    const order = await orderService.create(orderData);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order },
    });
  });

  /**
   * Get order by ID with full details
   */
  getOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    const order = await orderService.getOrderWithDetails(orderId);

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: { order },
    });
  });

  /**
   * Update order status
   */
  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const statusData = validateSchema(orderSchemas.updateStatus, req.body);

    const order = await orderService.updateStatus(orderId, statusData);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order },
    });
  });

  /**
   * Assign order to provider
   */
  assignOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const assignmentData = validateSchema(orderSchemas.assign, req.body);

    const order = await orderService.assignToProvider(orderId, assignmentData);

    res.json({
      success: true,
      message: 'Order assigned successfully',
      data: { order },
    });
  });

  /**
   * Complete order
   */
  completeOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const {
      actualDeliveryTime,
      resultsPdfUrl,
      resultSummaryForDoctor,
      notes
    } = req.body;

    const completionData: any = {};
    if (actualDeliveryTime) completionData.actualDeliveryTime = new Date(actualDeliveryTime);
    if (resultsPdfUrl) completionData.resultsPdfUrl = resultsPdfUrl;
    if (resultSummaryForDoctor) completionData.resultSummaryForDoctor = resultSummaryForDoctor;
    if (notes) completionData.notes = notes;

    const order = await orderService.completeOrder(orderId, completionData);

    res.json({
      success: true,
      message: 'Order completed successfully',
      data: { order },
    });
  });

  /**
   * Cancel order
   */
  cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(orderId, reason);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order },
    });
  });

  /**
   * Search orders
   */
  searchOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      patientId,
      type,
      status,
      assignedProviderId,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10
    } = req.query;

    const searchCriteria: any = {};

    if (patientId) searchCriteria.patientId = patientId as string;
    if (type) searchCriteria.type = type as OrderType;
    if (status) searchCriteria.status = status as OrderStatus;
    if (assignedProviderId) searchCriteria.assignedProviderId = assignedProviderId as string;
    if (dateFrom) searchCriteria.dateFrom = new Date(dateFrom as string);
    if (dateTo) searchCriteria.dateTo = new Date(dateTo as string);
    if (minAmount) searchCriteria.minAmount = Number(minAmount);
    if (maxAmount) searchCriteria.maxAmount = Number(maxAmount);

    const orders = await orderService.searchOrders(searchCriteria);

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
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

  /**
   * Get orders by status
   */
  getOrdersByStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order status',
        error: 'INVALID_STATUS',
        validStatuses: Object.values(OrderStatus),
      });
      return;
    }

    const orders = await orderService.getOrdersByStatus(status as OrderStatus);

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
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


  /**
   * Get order statistics
   */
  getStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const statistics = await orderService.getOrderStatistics();

    res.json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: { statistics },
    });
  });

  /**
   * Get order bids
   */
  getOrderBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    const bids = await bidService.getOrderBids(orderId);

    res.json({
      success: true,
      message: 'Order bids retrieved successfully',
      data: { bids },
    });
  });
}
