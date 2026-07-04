import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TabService } from './tab.service';
import { Tab } from './entities/tab.entity';
import { Table, TableStatus } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
};

describe('TabService', () => {
  let service: TabService;
  let tabRepository: jest.Mocked<Repository<Tab>>;
  let tableRepository: jest.Mocked<Repository<Table>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TabService,
        { provide: getRepositoryToken(Tab), useValue: mockRepository() },
        { provide: getRepositoryToken(Table), useValue: mockRepository() },
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(Order), useValue: mockRepository() },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) },
        },
      ],
    }).compile();

    service = module.get<TabService>(TabService);
    tabRepository = module.get(getRepositoryToken(Tab));
    tableRepository = module.get(getRepositoryToken(Table));
    userRepository = module.get(getRepositoryToken(User));
    orderRepository = module.get(getRepositoryToken(Order));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openTab', () => {
    const createDto = {
      table_id: 'table-1',
      waiter_id: 'waiter-1',
      branch_id: 'branch-1',
      customer_name: 'John Doe',
      party_size: 4,
    };

    it('should open a new tab successfully', async () => {
      tabRepository.findOne.mockResolvedValue(null);

      const newTab = {
        id: 'tab-1',
        ...createDto,
        status: 'open',
        tab_number: 'TAB-1234567890',
        opened_at: new Date(),
      } as Tab;
      tabRepository.create.mockReturnValue(newTab as any);
      mockQueryRunner.manager.save.mockResolvedValue(newTab);
      mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });

      const result = await service.openTab(createDto);

      expect(result).toEqual(newTab);
      expect(tabRepository.findOne).toHaveBeenCalledWith({
        where: { table_id: 'table-1', status: 'open' },
      });
      expect(tabRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ table_id: 'table-1', status: 'open' }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(newTab);
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(Table, 'table-1', {
        status: TableStatus.OCCUPIED,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if an open tab already exists for the table', async () => {
      tabRepository.findOne.mockResolvedValue({ id: 'existing-tab' } as Tab);

      await expect(service.openTab(createDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      tabRepository.findOne.mockResolvedValue(null);
      tabRepository.create.mockReturnValue({} as any);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'));

      await expect(service.openTab(createDto)).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tab if found', async () => {
      const tab = { id: 'tab-1', branch_id: 'branch-1' } as Tab;
      tabRepository.findOne.mockResolvedValue(tab);

      const result = await service.findOne('tab-1', 'branch-1');
      expect(result).toBe(tab);
      expect(tabRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tab-1', branch_id: 'branch-1' },
      });
    });

    it('should throw NotFoundException when tab is not found', async () => {
      tabRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('tab-1', 'branch-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByBranch', () => {
    const branchId = 'branch-1';

    it('should return enriched tabs without pagination', async () => {
      const tabs = [
        { id: 'tab-1', table_id: 'table-1', waiter_id: 'waiter-1', branch_id: branchId },
        { id: 'tab-2', table_id: 'table-2', waiter_id: null, branch_id: branchId },
      ] as Tab[];

      tabRepository.find.mockResolvedValue(tabs);
      tableRepository.find.mockResolvedValue([
        { id: 'table-1', table_number: 'T1' },
        { id: 'table-2', table_number: 'T2' },
      ] as Table[]);
      userRepository.find.mockResolvedValue([{ id: 'waiter-1', full_name: 'John' }] as User[]);
      orderRepository.find.mockResolvedValue([
        { id: 'order-1', tab_id: 'tab-1', subtotal_kobo: 5000 },
        { id: 'order-2', tab_id: 'tab-1', subtotal_kobo: 3000 },
      ] as Order[]);

      const result = await service.findAllByBranch(branchId);

      expect(result).toHaveLength(2);
      expect(result[0].table).toBeDefined();
      expect(result[0].waiter).toBeDefined();
      expect(result[0].orders).toHaveLength(2);
      expect(result[0].total_kobo).toBe(8000);
      expect(result[1].table).toBeDefined();
      expect(result[1].waiter).toBeNull();
      expect(result[1].orders).toHaveLength(0);
      expect(result[1].total_kobo).toBe(0);
    });

    it('should return enriched tabs with pagination', async () => {
      const tabs = [{ id: 'tab-1', table_id: 'table-1', waiter_id: null, branch_id: branchId }] as Tab[];

      tabRepository.findAndCount.mockResolvedValue([tabs, 1]);
      tableRepository.find.mockResolvedValue([{ id: 'table-1', table_number: 'T1' }] as Table[]);
      userRepository.find.mockResolvedValue([]);
      orderRepository.find.mockResolvedValue([]);

      const result = await service.findAllByBranch(branchId, undefined, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, perPage: 20, total: 1, totalPages: 1 });
      expect(result.data[0].total_kobo).toBe(0);
    });

    it('should filter by status', async () => {
      tabRepository.find.mockResolvedValue([]);
      tableRepository.find.mockResolvedValue([]);
      userRepository.find.mockResolvedValue([]);
      orderRepository.find.mockResolvedValue([]);

      await service.findAllByBranch(branchId, 'open');

      expect(tabRepository.find).toHaveBeenCalledWith({
        where: { branch_id: branchId, status: 'open' },
        order: { opened_at: 'DESC' },
      });
    });

    it('should return empty array when no tabs exist', async () => {
      tabRepository.find.mockResolvedValue([]);

      const result = await service.findAllByBranch(branchId);
      expect(result).toEqual([]);
    });
  });

  describe('voidTab', () => {
    it('should void an open tab and release the table', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: 'branch-1', status: 'open' } as Tab;
      mockQueryRunner.manager.findOne.mockResolvedValue(tab);
      mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });
      mockQueryRunner.manager.save.mockResolvedValue({ ...tab, status: 'voided', closed_at: new Date() });

      const result = await service.voidTab('tab-1', 'branch-1');

      expect(result.status).toBe('voided');
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(Table, 'table-1', {
        status: TableStatus.AVAILABLE,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tab is not open', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.voidTab('tab-1', 'branch-1')).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tab is already paid', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: 'branch-1', status: 'paid' } as Tab;
      mockQueryRunner.manager.findOne.mockResolvedValue(tab);

      await expect(service.voidTab('tab-1', 'branch-1')).rejects.toThrow(NotFoundException);
    });

    it('should rollback on error', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.voidTab('tab-1', 'branch-1')).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('transferTab', () => {
    const branchId = 'branch-1';

    it('should transfer an open tab to an available target table', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: branchId, status: 'open' } as Tab;
      const targetTable = { id: 'table-2', branch_id: branchId, status: TableStatus.AVAILABLE } as Table;
      const savedTab = { ...tab, table_id: 'table-2' } as Tab;

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(tab)
        .mockResolvedValueOnce(targetTable);
      mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });
      mockQueryRunner.manager.save.mockResolvedValue(savedTab);

      const result = await service.transferTab('tab-1', 'table-2', branchId);

      expect(result.table_id).toBe('table-2');
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(Table, 'table-1', {
        status: TableStatus.AVAILABLE,
      });
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(Table, 'table-2', {
        status: TableStatus.OCCUPIED,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tab is not open', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.transferTab('tab-1', 'table-2', branchId)).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if target table does not exist', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: branchId, status: 'open' } as Tab;
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(tab)
        .mockResolvedValueOnce(null);

      await expect(service.transferTab('tab-1', 'table-2', branchId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target table is in a different branch', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: branchId, status: 'open' } as Tab;
      const targetTable = { id: 'table-2', branch_id: 'other-branch', status: TableStatus.AVAILABLE } as Table;
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(tab)
        .mockResolvedValueOnce(targetTable);

      await expect(service.transferTab('tab-1', 'table-2', branchId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target table is not available', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: branchId, status: 'open' } as Tab;
      const targetTable = { id: 'table-2', branch_id: branchId, status: TableStatus.OCCUPIED } as Table;
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(tab)
        .mockResolvedValueOnce(targetTable);

      await expect(service.transferTab('tab-1', 'table-2', branchId)).rejects.toThrow(NotFoundException);
    });

    it('should rollback on error', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.transferTab('tab-1', 'table-2', branchId)).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('closeTab', () => {
    it('should close an open tab and release the table', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: 'branch-1', status: 'open' } as Tab;
      mockQueryRunner.manager.findOne.mockResolvedValue(tab);
      mockQueryRunner.manager.update.mockResolvedValue({ affected: 1 });
      mockQueryRunner.manager.save.mockResolvedValue({ ...tab, status: 'paid', closed_at: new Date() });

      const result = await service.closeTab('tab-1', 'branch-1');

      expect(result.status).toBe('paid');
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(Table, 'table-1', {
        status: TableStatus.AVAILABLE,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tab is not open', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.closeTab('tab-1', 'branch-1')).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tab is already voided', async () => {
      const tab = { id: 'tab-1', table_id: 'table-1', branch_id: 'branch-1', status: 'voided' } as Tab;
      mockQueryRunner.manager.findOne.mockResolvedValue(tab);

      await expect(service.closeTab('tab-1', 'branch-1')).rejects.toThrow(NotFoundException);
    });

    it('should rollback on error', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.closeTab('tab-1', 'branch-1')).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update tab fields', async () => {
      const existingTab = { id: 'tab-1', branch_id: 'branch-1', customer_name: 'Old', party_size: 2 } as Tab;
      tabRepository.findOne.mockResolvedValue(existingTab);
      tabRepository.save.mockResolvedValue({
        ...existingTab,
        customer_name: 'New Name',
        party_size: 5,
      } as Tab);

      const result = await service.update('tab-1', 'branch-1', {
        customer_name: 'New Name',
        party_size: 5,
      });

      expect(result.customer_name).toBe('New Name');
      expect(result.party_size).toBe(5);
      expect(tabRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ customer_name: 'New Name', party_size: 5 }),
      );
    });

    it('should throw NotFoundException if tab does not exist', async () => {
      tabRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('tab-1', 'branch-1', { customer_name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing tab', async () => {
      const tab = { id: 'tab-1', branch_id: 'branch-1' } as Tab;
      tabRepository.findOne.mockResolvedValue(tab);
      tabRepository.remove.mockResolvedValue(tab);

      const result = await service.remove('tab-1', 'branch-1');

      expect(result).toBe(tab);
      expect(tabRepository.remove).toHaveBeenCalledWith(tab);
    });

    it('should throw NotFoundException if tab does not exist', async () => {
      tabRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('tab-1', 'branch-1')).rejects.toThrow(NotFoundException);
    });
  });
});
