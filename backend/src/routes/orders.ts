import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { 
  authenticate, 
  adminOnly, 
  healthcareStaffOnly,
  patientOrAdmin,
  providerStaffOnly,
  authorizeOwnership,
  requireActiveAccount,
  auditLog 
} from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';
import { orderSchemas } from '../utils/validation';
import Joi from 'joi';

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(authenticate);
router.use(requireActiveAccount);

// Validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const orderCompletionSchema = Joi.object({
  actualDeliveryTime: Joi.date().optional(),
  resultsPdfUrl: Joi.string().uri().optional(),
  resultSummaryForDoctor: Joi.string().max(2000).optional(),
  notes: Joi.string().max(1000).optional(),
});

const orderCancellationSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required(),
});

// Create order (patients and healthcare staff)
router.post('/', 
  healthcareStaffOnly, // Only healthcare staff can create orders for now
  validateRequest(orderSchemas.create),
  auditLog('CREATE_ORDER'),
  orderController.createOrder
);

// Get order details
router.get('/:orderId', 
  patientOrAdmin, // Patients can view their own orders, admins can view all
  auditLog('GET_ORDER'),
  orderController.getOrder
);

// Update order status (providers and admins)
router.put('/:orderId/status', 
  providerStaffOnly,
  validateRequest(orderSchemas.updateStatus),
  auditLog('UPDATE_ORDER_STATUS'),
  orderController.updateStatus
);

// Assign order to provider (admins only)
router.put('/:orderId/assign', 
  adminOnly,
  validateRequest(orderSchemas.assign),
  auditLog('ASSIGN_ORDER'),
  orderController.assignOrder
);

// Complete order (providers and admins)
router.put('/:orderId/complete', 
  providerStaffOnly,
  validateRequest(orderCompletionSchema),
  auditLog('COMPLETE_ORDER'),
  orderController.completeOrder
);

// Cancel order (patients, providers, and admins)
router.put('/:orderId/cancel', 
  patientOrAdmin, // Patients can cancel their own orders
  validateRequest(orderCancellationSchema),
  auditLog('CANCEL_ORDER'),
  orderController.cancelOrder
);

// Search orders (healthcare staff and admins)
router.get('/', 
  healthcareStaffOnly,
  validateRequest(paginationSchema, 'query'),
  auditLog('SEARCH_ORDERS'),
  orderController.searchOrders
);

// Get orders by status (healthcare staff and admins)
router.get('/status/:status', 
  healthcareStaffOnly,
  validateRequest(paginationSchema, 'query'),
  auditLog('GET_ORDERS_BY_STATUS'),
  orderController.getOrdersByStatus
);

// Get order bids (admins and providers)
router.get('/:orderId/bids', 
  providerStaffOnly,
  auditLog('GET_ORDER_BIDS'),
  orderController.getOrderBids
);

// Statistics (admin only)
router.get('/admin/statistics', 
  adminOnly,
  auditLog('GET_ORDER_STATISTICS'),
  orderController.getStatistics
);

export default router;
