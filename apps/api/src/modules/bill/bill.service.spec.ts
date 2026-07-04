import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BillService } from './bill.service';
import { Bill } from './entities/bill.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Order } from '../order/entities/order.entity';
import { Table, TableStatus } from '../table/entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { User } from '../user/entities/user.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Business } from '../business/entities/business.entity';
import { PosTerminal } from '../pos/entities/pos-terminal.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillService', () => {
  let service: BillService;
  let billRepository: jest.Mocked<Repository<Bill>>;
  let tabRepository: jest.Mocked<Repository<Tab>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let tableRepository: jest.Mocked<Repository<Table>>;
  let menuItemRepository: jest.Mocked<Repository<MenuItem>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let branchRepository: jest.Mocked<Repository<Branch>>;
  let businessRepository: jest.Mocked<Repository<Business>>;
  let posTerminalRepository: jest.Mocked<Repository<PosTerminal>>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillService,
        { provide: getRepositoryToken(Bill), useValue: mockRepository() },
        { provide: getRepositoryToken(Tab), useValue: mockRepository() },
        { provide: getRepositoryToken(Order), useValue: mockRepository() },
        { provide: getRepositoryToken(Table), useValue: mockRepository() },
        { provide: getRepositoryToken(MenuItem), useValue: mockRepository() },
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(Branch), useValue: mockRepository() },
        { provide: getRepositoryToken(Business), useValue: mockRepository() },
        { provide: getRepositoryToken(PosTerminal), useValue: mockRepository() },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
      ],
    }).compile();

    service = module.get<BillService>(BillService);
    billRepository = module.get(getRepositoryToken(Bill));
    tabRepository = module.get(getRepositoryToken(Tab));
    orderRepository = module.get(getRepositoryToken(Order));
    tableRepository = module.get(getRepositoryToken(Table));
    menuItemRepository = module.get(getRepositoryToken(MenuItem));
    userRepository = module.get(getRepositoryToken(User));
    branchRepository = module.get(getRepositoryToken(Branch));
    businessRepository = module.get(getRepositoryToken(Business));
    posTerminalRepository = module.get(getRepositoryToken(PosTerminal));
  });

  describe('generateBill', () => {
    const tabId = 'tab-1';
    const userId = 'user-1';

    it('should generate a bill with default 10% service charge', async () => {
      const orders = [
        { subtotal_kobo: 5000 },
        { subtotal_kobo: 3000 },
      ] as Order[];
      orderRepository.find.mockResolvedValue(orders);
      const savedBill = { id: 'bill-1', tab_id: tabId, subtotal_kobo: 8000, service_charge_kobo: 800, discount_kobo: 0, total_kobo: 8800, issued_by: userId };
      billRepository.create.mockReturnValue(savedBill as any);
      billRepository.save.mockResolvedValue(savedBill as any);
      tabRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.generateBill(tabId, userId);

      expect(result.total_kobo).toBe(8800);
      expect(result.service_charge_kobo).toBe(800);
      expect(billRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tab_id: tabId, subtotal_kobo: 8000, service_charge_kobo: 800, discount_kobo: 0, total_kobo: 8800 })
      );
      expect(tabRepository.update).toHaveBeenCalledWith(tabId, { status: 'billed', billed_at: expect.any(Date) });
    });

    it('should apply custom service charge percent', async () => {
      orderRepository.find.mockResolvedValue([{ subtotal_kobo: 10000 }] as Order[]);
      const savedBill = { id: 'bill-2', tab_id: tabId, subtotal_kobo: 10000, service_charge_kobo: 500, discount_kobo: 0, total_kobo: 10500 };
      billRepository.create.mockReturnValue(savedBill as any);
      billRepository.save.mockResolvedValue(savedBill as any);
      tabRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.generateBill(tabId, userId, { service_charge_percent: 5 });

      expect(result.service_charge_kobo).toBe(500);
      expect(result.total_kobo).toBe(10500);
    });

    it('should apply a discount', async () => {
      orderRepository.find.mockResolvedValue([{ subtotal_kobo: 10000 }] as Order[]);
      const savedBill = { id: 'bill-3', tab_id: tabId, subtotal_kobo: 10000, service_charge_kobo: 1000, discount_kobo: 2000, total_kobo: 9000 };
      billRepository.create.mockReturnValue(savedBill as any);
      billRepository.save.mockResolvedValue(savedBill as any);
      tabRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.generateBill(tabId, userId, { discount_kobo: 2000 });

      expect(result.discount_kobo).toBe(2000);
      expect(result.total_kobo).toBe(9000);
    });

    it('should handle empty orders (zero subtotal)', async () => {
      orderRepository.find.mockResolvedValue([]);
      const savedBill = { id: 'bill-4', tab_id: tabId, subtotal_kobo: 0, service_charge_kobo: 0, discount_kobo: 0, total_kobo: 0 };
      billRepository.create.mockReturnValue(savedBill as any);
      billRepository.save.mockResolvedValue(savedBill as any);
      tabRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.generateBill(tabId, userId);

      expect(result.subtotal_kobo).toBe(0);
      expect(result.total_kobo).toBe(0);
    });
  });

  describe('processPayment', () => {
    const tabId = 'tab-1';

    it('should process payment successfully', async () => {
      const bill = { id: 'bill-1', tab_id: tabId, total_kobo: 10000, payment_method: null, payment_amount_kobo: null, paid_at: null } as unknown as Bill;
      billRepository.findOne.mockResolvedValue(bill);
      billRepository.save.mockResolvedValue({ ...bill, payment_method: 'cash', payment_amount_kobo: 10000, paid_at: new Date() } as any);

      const tab = { id: tabId, table_id: 'table-1' } as Tab;
      tabRepository.findOne.mockResolvedValue(tab);
      tabRepository.update.mockResolvedValue({ affected: 1 } as any);
      tableRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.processPayment(tabId, { amount: 10000, method: 'cash' });

      expect(result.payment_method).toBe('cash');
      expect(billRepository.save).toHaveBeenCalled();
      expect(tabRepository.update).toHaveBeenCalledWith(tabId, { status: 'paid', closed_at: expect.any(Date) });
      expect(tableRepository.update).toHaveBeenCalledWith('table-1', { status: TableStatus.AVAILABLE });
    });

    it('should throw BadRequestException when payment is less than total', async () => {
      const bill = { id: 'bill-1', tab_id: tabId, total_kobo: 10000 } as Bill;
      billRepository.findOne.mockResolvedValue(bill);

      await expect(service.processPayment(tabId, { amount: 5000, method: 'cash' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when bill does not exist', async () => {
      billRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(tabId, { amount: 10000, method: 'cash' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should store reference and terminal_id when provided', async () => {
      const bill = { id: 'bill-1', tab_id: tabId, total_kobo: 5000 } as unknown as Bill;
      billRepository.findOne.mockResolvedValue(bill);
      const tab = { id: tabId, table_id: 'table-1' } as Tab;
      tabRepository.findOne.mockResolvedValue(tab);
      billRepository.save.mockResolvedValue({ ...bill, payment_reference: 'REF-001', terminal_id: 'term-1' } as any);
      tabRepository.update.mockResolvedValue({ affected: 1 } as any);
      tableRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.processPayment(tabId, { amount: 5000, method: 'card', reference: 'REF-001', terminal_id: 'term-1' });

      expect(result.payment_reference).toBe('REF-001');
      expect(billRepository.save).toHaveBeenCalledWith(expect.objectContaining({ payment_reference: 'REF-001', terminal_id: 'term-1' }));
    });
  });

  describe('getReceipt', () => {
    const tabId = 'tab-1';

    it('should return a full receipt with all relations', async () => {
      const tab = { id: tabId, table_id: 'table-1', waiter_id: 'waiter-1', branch_id: 'branch-1' } as Tab;
      const bill = { id: 'bill-1', tab_id: tabId, terminal_id: 'term-1' } as Bill;
      const orders = [
        { id: 'order-1', menu_item_id: 'menu-1' },
        { id: 'order-2', menu_item_id: 'menu-2' },
      ] as Order[];
      const menuItems = [
        { id: 'menu-1', name: 'Pizza' },
        { id: 'menu-2', name: 'Pasta' },
      ] as MenuItem[];
      const table = { id: 'table-1', table_number: 'T1' } as Table;
      const waiter = { id: 'waiter-1', full_name: 'John' } as User;
      const branch = { id: 'branch-1', business_id: 'biz-1' } as Branch;
      const business = { id: 'biz-1', name: 'BizCorp' } as Business;
      const terminal = { id: 'term-1', label: 'POS-1' } as PosTerminal;

      tabRepository.findOne.mockResolvedValue(tab);
      billRepository.findOne.mockResolvedValue(bill);
      orderRepository.find.mockResolvedValue(orders);
      menuItemRepository.find.mockResolvedValue(menuItems);
      tableRepository.findOne.mockResolvedValue(table);
      userRepository.findOne.mockResolvedValue(waiter);
      branchRepository.findOne.mockResolvedValue(branch);
      businessRepository.findOne.mockResolvedValue(business);
      posTerminalRepository.findOne.mockResolvedValue(terminal);

      const result = await service.getReceipt(tabId);

      expect(result.tab).toBe(tab);
      expect(result.bill).toBe(bill);
      expect(result.table).toBe(table);
      expect(result.waiter).toBe(waiter);
      expect(result.branch).toBe(branch);
      expect(result.business).toBe(business);
      expect(result.terminal).toBe(terminal);
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].menu_item.name).toBe('Pizza');
      expect(result.orders[1].menu_item.name).toBe('Pasta');
      expect(result.receipt_number).toMatch(/^RCP-/);
    });

    it('should throw NotFoundException when tab is not found', async () => {
      tabRepository.findOne.mockResolvedValue(null);

      await expect(service.getReceipt(tabId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when bill is not found', async () => {
      tabRepository.findOne.mockResolvedValue({ id: tabId } as Tab);
      billRepository.findOne.mockResolvedValue(null);

      await expect(service.getReceipt(tabId)).rejects.toThrow(NotFoundException);
    });

    it('should handle missing waiter and terminal gracefully', async () => {
      const tab = { id: tabId, table_id: 'table-1', waiter_id: null, branch_id: 'branch-1' } as Tab;
      const bill = { id: 'bill-1', tab_id: tabId, terminal_id: null } as Bill;
      const branch = { id: 'branch-1', business_id: 'biz-1' } as Branch;
      const business = { id: 'biz-1' } as Business;

      tabRepository.findOne.mockResolvedValue(tab);
      billRepository.findOne.mockResolvedValue(bill);
      orderRepository.find.mockResolvedValue([]);
      tableRepository.findOne.mockResolvedValue(null);
      branchRepository.findOne.mockResolvedValue(branch);
      businessRepository.findOne.mockResolvedValue(business);

      const result = await service.getReceipt(tabId);

      expect(result.waiter).toBeNull();
      expect(result.terminal).toBeNull();
      expect(result.orders).toEqual([]);
    });
  });
});
