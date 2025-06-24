import { OrderService } from '../../src/services/OrderService';
import Order, { OrderStatus, OrderType } from '../../src/models/Order';
import Patient from '../../src/models/Patient';
import Provider from '../../src/models/Provider';
import {
  createMockOrder,
  createMockPatient,
  createMockProvider,
  expectValidationError,
  expectNotFoundError,
  expectAsync
} from '../setup';

// Mock the models
jest.mock('../../src/models/Order');
jest.mock('../../src/models/Patient');
jest.mock('../../src/models/Provider');
const MockOrder = Order as jest.MockedClass<typeof Order>;
const MockPatient = Patient as jest.MockedClass<typeof Patient>;
const MockProvider = Provider as jest.MockedClass<typeof Provider>;

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrder: any;
  let mockPatient: any;
  let mockProvider: any;

  beforeEach(() => {
    orderService = new OrderService();
    mockOrder = createMockOrder();
    mockPatient = createMockPatient();
    mockProvider = createMockProvider();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    MockOrder.findByPk = jest.fn();
    MockOrder.findOne = jest.fn();
    MockOrder.create = jest.fn();
    MockOrder.findAll = jest.fn();
    MockOrder.count = jest.fn();
    MockOrder.findAndCountAll = jest.fn();
    
    // Add mock methods to order instance
    mockOrder.update = jest.fn();
    mockOrder.canReceiveBids = jest.fn().mockReturnValue(true);
    mockOrder.canBeAssigned = jest.fn().mockReturnValue(true);
    mockOrder.canBeCancelled = jest.fn().mockReturnValue(true);
    mockOrder.canBeCompleted = jest.fn().mockReturnValue(true);
  });

  describe('create', () => {
    const validOrderData = {
      patientId: 'patient-123',
      type: OrderType.PHARMACY,
      prescriptionData: { medications: ['aspirin'] },
      totalAmount: 50.00,
      urgency: 'medium' as const,
      deliveryAddress: '123 Test St, Test City, TS 12345',
    };

    it('should create a new order successfully', async () => {
      MockOrder.create.mockResolvedValue(mockOrder);

      const result = await orderService.create(validOrderData);

      expect(MockOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validOrderData,
          status: OrderStatus.PENDING,
          orderDate: expect.any(Date),
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should throw validation error for invalid order type', async () => {
      const invalidData = { ...validOrderData, type: 'invalid' as any };
      
      const { error } = await expectAsync(orderService.create(invalidData));
      
      expectValidationError(error, 'type');
    });

    it('should throw validation error for negative amount', async () => {
      const invalidData = { ...validOrderData, totalAmount: -10 };
      
      const { error } = await expectAsync(orderService.create(invalidData));
      
      expectValidationError(error, 'totalAmount');
    });

    it('should throw validation error for missing prescription data for pharmacy order', async () => {
      const invalidData = { ...validOrderData, prescriptionData: undefined };
      
      const { error } = await expectAsync(orderService.create(invalidData));
      
      expectValidationError(error, 'prescriptionData');
    });
  });

  describe('getOrderWithDetails', () => {
    it('should get order with full details successfully', async () => {
      const orderWithDetails = {
        ...mockOrder,
        Patient: mockPatient,
        AssignedProvider: mockProvider,
      };
      MockOrder.findByPk.mockResolvedValue(orderWithDetails);

      const result = await orderService.getOrderWithDetails('order-123');

      expect(MockOrder.findByPk).toHaveBeenCalledWith('order-123', {
        include: [
          { model: MockPatient, as: 'Patient' },
          { model: MockProvider, as: 'AssignedProvider' },
        ]
      });
      expect(result).toEqual(orderWithDetails);
    });

    it('should throw not found error for non-existent order', async () => {
      MockOrder.findByPk.mockResolvedValue(null);

      const { error } = await expectAsync(orderService.getOrderWithDetails('non-existent'));
      
      expectNotFoundError(error, 'Order');
    });
  });

  describe('updateStatus', () => {
    const statusData = {
      status: OrderStatus.IN_PROGRESS,
      notes: 'Order is being processed',
    };

    it('should update order status successfully', async () => {
      MockOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update.mockResolvedValue({ ...mockOrder, ...statusData });

      const result = await orderService.updateStatus('order-123', statusData);

      expect(mockOrder.update).toHaveBeenCalledWith(statusData, {});
      expect(result.status).toEqual(statusData.status);
    });

    it('should throw validation error for invalid status transition', async () => {
      const completedOrder = { ...mockOrder, status: OrderStatus.COMPLETED };
      MockOrder.findByPk.mockResolvedValue(completedOrder);
      completedOrder.update = jest.fn();

      const { error } = await expectAsync(
        orderService.updateStatus('order-123', { status: OrderStatus.PENDING })
      );
      
      expectValidationError(error, 'status');
    });
  });

  describe('assignToProvider', () => {
    const assignmentData = {
      providerId: 'provider-123',
      estimatedDeliveryTime: new Date(),
      notes: 'Assigned to provider',
    };

    it('should assign order to provider successfully', async () => {
      MockOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update.mockResolvedValue({
        ...mockOrder,
        assignedProviderId: assignmentData.providerId,
        status: OrderStatus.ASSIGNED,
      });

      const result = await orderService.assignToProvider('order-123', assignmentData);

      expect(mockOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedProviderId: assignmentData.providerId,
          status: OrderStatus.ASSIGNED,
        }),
        {}
      );
    });

    it('should throw validation error if order cannot be assigned', async () => {
      mockOrder.canBeAssigned.mockReturnValue(false);
      MockOrder.findByPk.mockResolvedValue(mockOrder);

      const { error } = await expectAsync(
        orderService.assignToProvider('order-123', assignmentData)
      );
      
      expectValidationError(error, 'status');
    });
  });

  describe('completeOrder', () => {
    const completionData = {
      actualDeliveryTime: new Date(),
      resultsPdfUrl: 'https://example.com/results.pdf',
      notes: 'Order completed successfully',
    };

    it('should complete order successfully', async () => {
      MockOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.COMPLETED,
        ...completionData,
      });

      const result = await orderService.completeOrder('order-123', completionData);

      expect(mockOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.COMPLETED,
          ...completionData,
        }),
        {}
      );
    });

    it('should throw validation error if order cannot be completed', async () => {
      mockOrder.canBeCompleted.mockReturnValue(false);
      MockOrder.findByPk.mockResolvedValue(mockOrder);

      const { error } = await expectAsync(
        orderService.completeOrder('order-123', completionData)
      );
      
      expectValidationError(error, 'status');
    });
  });

  describe('cancelOrder', () => {
    const reason = 'Patient requested cancellation';

    it('should cancel order successfully', async () => {
      MockOrder.findByPk.mockResolvedValue(mockOrder);
      mockOrder.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancellationReason: reason,
      });

      const result = await orderService.cancelOrder('order-123', reason);

      expect(mockOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CANCELLED,
          cancellationReason: reason,
        }),
        {}
      );
    });

    it('should throw validation error if order cannot be cancelled', async () => {
      mockOrder.canBeCancelled.mockReturnValue(false);
      MockOrder.findByPk.mockResolvedValue(mockOrder);

      const { error } = await expectAsync(orderService.cancelOrder('order-123', reason));
      
      expectValidationError(error, 'status');
    });
  });

  describe('searchOrders', () => {
    const searchCriteria = {
      patientId: 'patient-123',
      type: OrderType.PHARMACY,
      status: OrderStatus.PENDING,
      dateFrom: new Date('2023-01-01'),
      dateTo: new Date('2023-12-31'),
    };

    it('should search orders successfully', async () => {
      const orders = [mockOrder];
      MockOrder.findAll.mockResolvedValue(orders);

      const result = await orderService.searchOrders(searchCriteria);

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: searchCriteria.patientId,
            type: searchCriteria.type,
            status: searchCriteria.status,
          }),
          include: expect.any(Array),
        })
      );
      expect(result).toEqual(orders);
    });

    it('should handle empty search criteria', async () => {
      const orders = [mockOrder];
      MockOrder.findAll.mockResolvedValue(orders);

      const result = await orderService.searchOrders({});

      expect(MockOrder.findAll).toHaveBeenCalled();
      expect(result).toEqual(orders);
    });
  });

  describe('getOrdersByStatus', () => {
    it('should get orders by status successfully', async () => {
      const orders = [mockOrder];
      MockOrder.findAll.mockResolvedValue(orders);

      const result = await orderService.getOrdersByStatus(OrderStatus.PENDING);

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: OrderStatus.PENDING },
        })
      );
      expect(result).toEqual(orders);
    });
  });

  describe('getActiveOrders', () => {
    it('should get active orders successfully', async () => {
      const orders = [mockOrder];
      MockOrder.findAll.mockResolvedValue(orders);

      const result = await orderService.getActiveOrders();

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: expect.objectContaining({
              [expect.any(Symbol)]: expect.arrayContaining([
                OrderStatus.PENDING,
                OrderStatus.AWAITING_BIDS,
                OrderStatus.ASSIGNED,
                OrderStatus.IN_PROGRESS,
              ])
            })
          })
        })
      );
      expect(result).toEqual(orders);
    });
  });

  describe('getOrderStatistics', () => {
    it('should get order statistics successfully', async () => {
      MockOrder.count
        .mockResolvedValueOnce(100) // total orders
        .mockResolvedValueOnce(20)  // pending orders
        .mockResolvedValueOnce(30)  // in progress orders
        .mockResolvedValueOnce(40)  // completed orders
        .mockResolvedValueOnce(10)  // cancelled orders
        .mockResolvedValueOnce(60)  // pharmacy orders
        .mockResolvedValueOnce(40); // lab orders

      const result = await orderService.getOrderStatistics();

      expect(result).toEqual({
        totalOrders: 100,
        ordersByStatus: {
          pending: 20,
          in_progress: 30,
          completed: 40,
          cancelled: 10,
        },
        ordersByType: {
          pharmacy: 60,
          lab: 40,
        },
      });
    });
  });

  describe('getPatientOrders', () => {
    it('should get patient orders successfully', async () => {
      const orders = [mockOrder];
      MockOrder.findAll.mockResolvedValue(orders);

      const result = await orderService.getPatientOrders('patient-123');

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: 'patient-123' },
          include: expect.any(Array),
          order: [['orderDate', 'DESC']],
        })
      );
      expect(result).toEqual(orders);
    });
  });

  describe('getProviderOrders', () => {
    it('should get provider orders successfully', async () => {
      const orders = [mockOrder];
      MockOrder.findAll.mockResolvedValue(orders);

      const result = await orderService.getProviderOrders('provider-123');

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assignedProviderId: 'provider-123' },
          include: expect.any(Array),
          order: [['orderDate', 'DESC']],
        })
      );
      expect(result).toEqual(orders);
    });
  });
});
