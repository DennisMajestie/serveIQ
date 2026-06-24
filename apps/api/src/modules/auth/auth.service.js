import { __decorate, __metadata } from "tslib";
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Business } from '../business/entities/business.entity';
import { Branch } from '../branch/entities/branch.entity';
import { UserRole } from '../../common/shared';
let AuthService = class AuthService {
    jwtService;
    dataSource;
    constructor(jwtService, dataSource) {
        this.jwtService = jwtService;
        this.dataSource = dataSource;
    }
    async register(dto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // 1. Create Business
            const business = queryRunner.manager.create(Business, {
                name: dto.businessName,
                slug: dto.businessName.toLowerCase().replace(/ /g, '-'),
                type: dto.businessType,
                owner_id: 'pending',
                email: dto.email,
                logo_url: dto.logoUrl ?? null,
                cac_document_url: dto.cacDocumentUrl ?? null,
            });
            const savedBusiness = await queryRunner.manager.save(business);
            // 2. Create Default Branch
            const branch = queryRunner.manager.create(Branch, {
                business_id: savedBusiness.id,
                name: 'Main Branch',
                is_active: true,
            });
            const savedBranch = await queryRunner.manager.save(branch);
            // 3. Create Owner User
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(dto.password, salt);
            const user = queryRunner.manager.create(User, {
                business_id: savedBusiness.id,
                branch_id: savedBranch.id,
                full_name: dto.fullName,
                email: dto.email,
                password_hash: passwordHash,
                role: UserRole.OWNER,
                is_active: true,
            });
            const savedUser = await queryRunner.manager.save(user);
            // 4. Update Business with Owner ID
            savedBusiness.owner_id = savedUser.id;
            await queryRunner.manager.save(savedBusiness);
            await queryRunner.commitTransaction();
            return this.generateTokens(savedUser);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            if (err.code === '23505') {
                throw new ConflictException('Email already exists');
            }
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async login(dto) {
        const user = await this.dataSource.getRepository(User).findOne({
            where: { email: dto.email },
            relations: { business: true, branch: true },
        });
        if (user && (await bcrypt.compare(dto.password, user.password_hash))) {
            return this.generateTokens(user);
        }
        throw new UnauthorizedException('Invalid credentials');
    }
    async logger(context, data) {
        console.log(`[AuthService:${context}]`, JSON.stringify(data, null, 2));
    }
    async waiterLogin(dto) {
        await this.logger('waiterLogin', dto);
        if (!dto.pin) {
            // Just return a generic unauthorized instead of bad request to avoid confusing the frontend
            throw new UnauthorizedException('Staff PIN is required');
        }
        const whereClause = {
            role: UserRole.WAITER,
            is_active: true,
        };
        if (dto.branchId && dto.branchId.length === 36) {
            whereClause.branch_id = dto.branchId;
        }
        if (dto.businessId) {
            whereClause.business_id = dto.businessId;
        }
        const waiters = await this.dataSource.getRepository(User).find({
            where: whereClause,
        });
        for (const waiter of waiters) {
            if (waiter.pin_hash && (await bcrypt.compare(dto.pin, waiter.pin_hash))) {
                return this.generateTokens(waiter);
            }
        }
        throw new UnauthorizedException('Invalid PIN');
    }
    async activate(dto) {
        await this.logger('activate', dto);
        const user = await this.dataSource.getRepository(User).findOne({
            where: [
                { email: dto.email, role: UserRole.OWNER },
                { email: dto.email, role: UserRole.SUPER_ADMIN }
            ],
            relations: { business: true },
        });
        if (user && (await bcrypt.compare(dto.password, user.password_hash))) {
            // Find the first branch for this business - either via user.branch_id or just find one
            let branch = await this.dataSource.getRepository(Branch).findOne({
                where: { id: user.branch_id }
            });
            if (!branch && user.business_id) {
                branch = await this.dataSource.getRepository(Branch).findOne({
                    where: { business_id: user.business_id },
                });
            }
            return {
                success: true,
                business: user.business,
                branch: branch,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    role: user.role
                }
            };
        }
        throw new UnauthorizedException('Invalid admin credentials or not an owner/admin');
    }
    generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            businessId: user.business_id,
            branchId: user.branch_id,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.full_name,
                business: user.business_id,
                branch: user.branch_id,
            },
        };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        DataSource])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map