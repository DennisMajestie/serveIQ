import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/user/entities/user.entity';
import { Business } from '../modules/business/entities/business.entity';
import { Branch } from '../modules/branch/entities/branch.entity';
import { Table } from '../modules/table/entities/table.entity';
import { MenuItem } from '../modules/menu/entities/menu-item.entity';
import { TableStatus, UserRole } from '../common/shared';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const userRepository = this.dataSource.getRepository(User);
    const businessRepository = this.dataSource.getRepository(Business);
    const branchRepository = this.dataSource.getRepository(Branch);

    // 1. Check if owner exists
    const adminEmail = 'demo@serveiq.com';
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      console.log('[SeedService] Seeding initial data...');

      // Create Business
      const business = businessRepository.create({
        name: 'ServeIQ Demo',
        type: 'restaurant',
        email: adminEmail,
        is_active: true,
      });
      const savedBusiness = await businessRepository.save(business);

      // Create Branch
      const branch = branchRepository.create({
        business_id: savedBusiness.id,
        name: 'Main Branch',
        is_active: true,
      });
      const savedBranch = await branchRepository.save(branch);

      // Create Owner
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash('password', salt);
      const owner = userRepository.create({
        business_id: savedBusiness.id,
        branch_id: savedBranch.id,
        full_name: 'Demo Owner',
        email: adminEmail,
        password_hash: passwordHash,
        role: UserRole.OWNER,
        is_active: true,
      });
      const savedOwner = await userRepository.save(owner);

      // Update business owner_id
      savedBusiness.owner_id = savedOwner.id;
      await businessRepository.save(savedBusiness);

      // Create Test Waiter
      const waiterPinHash = await bcrypt.hash('1234', salt);
      const waiter = userRepository.create({
        business_id: savedBusiness.id,
        branch_id: savedBranch.id,
        full_name: 'Test Waiter',
        email: 'waiter@serveiq.com',
        password_hash: await bcrypt.hash('waiter123', salt), // Placeholder
        pin_hash: waiterPinHash,
        role: UserRole.WAITER,
        is_active: true,
      });
      await userRepository.save(waiter);

      console.log('[SeedService] Seeding completed.');
    } else {
      console.log('[SeedService] Admin user already exists. Skipping initial seed.');
    }

    // Always seed tables and menu items if missing
    const tableRepository = this.dataSource.getRepository(Table);
    const menuItemRepository = this.dataSource.getRepository(MenuItem);

    const existingTableCount = await tableRepository.count();
    const existingMenuItemCount = await menuItemRepository.count();

    if (existingTableCount === 0 || existingMenuItemCount === 0) {
      const branch = await branchRepository.findOne({ where: { is_active: true } });
      if (!branch) {
        console.log('[SeedService] No active branch found. Skipping table/menu seed.');
        return;
      }
    }

    if (existingTableCount === 0) {
      console.log('[SeedService] Seeding tables...');

      const tables = [
        { table_number: 'T1', label: 'Table 1 - Window', capacity: 2 },
        { table_number: 'T2', label: 'Table 2 - Window', capacity: 2 },
        { table_number: 'T3', label: 'Table 3 - Center', capacity: 4 },
        { table_number: 'T4', label: 'Table 4 - Center', capacity: 4 },
        { table_number: 'T5', label: 'Table 5 - Patio', capacity: 6 },
        { table_number: 'T6', label: 'VIP Corner', capacity: 8 },
        { table_number: 'T7', label: 'Bar Seats', capacity: 1 },
        { table_number: 'T8', label: 'Private Room', capacity: 10 },
      ];

      for (const t of tables) {
        const existing = await tableRepository.findOne({ where: { table_number: t.table_number, branch_id: branch!.id } });
        if (!existing) {
          await tableRepository.save(
            tableRepository.create({
              branch_id: branch!.id,
              table_number: t.table_number,
              label: t.label,
              capacity: t.capacity,
              status: TableStatus.AVAILABLE,
            }),
          );
        }
      }

      console.log(`[SeedService] Seeded ${tables.length} tables.`);
    }

    if (existingMenuItemCount === 0) {
      console.log('[SeedService] Seeding menu items...');

      const admin = await this.dataSource.getRepository(User).findOne({ where: { email: 'demo@serveiq.com' } });
      const createdBy = admin?.id || 'system';

      const menuItems = [
        { name: 'Jollof Rice & Chicken', category: 'Mains', price_kobo: 15000, unit: 'plate' },
        { name: 'Fried Rice & Beef', category: 'Mains', price_kobo: 14000, unit: 'plate' },
        { name: 'Pounded Yam & Egusi Soup', category: 'Mains', price_kobo: 18000, unit: 'plate' },
        { name: 'Grilled Tilapia', category: 'Mains', price_kobo: 12000, unit: 'piece' },
        { name: 'Suya Skewers', category: 'Small Chops', price_kobo: 5000, unit: 'skewer' },
        { name: 'Spring Rolls', category: 'Small Chops', price_kobo: 3500, unit: 'pack' },
        { name: 'Samosa (Beef)', category: 'Small Chops', price_kobo: 3000, unit: 'piece' },
        { name: 'Pepper Soup (Catfish)', category: 'Soups', price_kobo: 8000, unit: 'bowl' },
        { name: 'Pepper Soup (Goat Meat)', category: 'Soups', price_kobo: 9000, unit: 'bowl' },
        { name: 'Coca Cola', category: 'Drinks', price_kobo: 2000, unit: 'bottle' },
        { name: 'Fanta Orange', category: 'Drinks', price_kobo: 2000, unit: 'bottle' },
        { name: 'Chapman Mocktail', category: 'Drinks', price_kobo: 3500, unit: 'glass' },
        { name: 'Zobo Drink', category: 'Drinks', price_kobo: 1500, unit: 'cup' },
        { name: 'Chin Chin', category: 'Snacks', price_kobo: 1500, unit: 'pack' },
        { name: 'Plantain Chips', category: 'Snacks', price_kobo: 2000, unit: 'pack' },
        { name: 'Chocolate Cake', category: 'Desserts', price_kobo: 5000, unit: 'slice' },
        { name: 'Vanilla Ice Cream', category: 'Desserts', price_kobo: 3000, unit: 'scoop' },
      ];

      for (const m of menuItems) {
        const existing = await menuItemRepository.findOne({ where: { name: m.name, branch_id: branch!.id } });
        if (!existing) {
          await menuItemRepository.save(
            menuItemRepository.create({
              branch_id: branch!.id,
              name: m.name,
              category: m.category,
              price_kobo: m.price_kobo,
              unit: m.unit,
              is_available: true,
              created_by: createdBy,
            }),
          );
        }
      }

      console.log(`[SeedService] Seeded ${menuItems.length} menu items.`);
    }
  }
}
