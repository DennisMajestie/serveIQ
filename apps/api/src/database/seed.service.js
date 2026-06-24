import { __decorate, __metadata } from "tslib";
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../modules/user/entities/user.entity';
import { Business } from '../modules/business/entities/business.entity';
import { Branch } from '../modules/branch/entities/branch.entity';
import { UserRole } from '../common/shared';
let SeedService = class SeedService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
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
        }
        else {
            console.log('[SeedService] Admin user already exists. Skipping seed.');
        }
    }
};
SeedService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DataSource])
], SeedService);
export { SeedService };
//# sourceMappingURL=seed.service.js.map