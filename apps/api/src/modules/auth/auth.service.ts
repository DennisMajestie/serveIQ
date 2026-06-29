import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DataSource, MoreThan } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Business } from '../business/entities/business.entity';
import { Branch } from '../branch/entities/branch.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WaiterLoginDto } from './dto/waiter-login.dto';
import { UserRole } from '../../common/shared';
import { VerificationToken } from './entities/verification-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
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
      } as Partial<Business>);
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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(dto: LoginDto) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: dto.email },
      relations: { business: true, branch: true },
    });

    if (user && (await bcrypt.compare(dto.password, user.password_hash))) {
      return this.generateTokens(user);
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async logger(context: string, data: any) {
    console.log(`[AuthService:${context}]`, JSON.stringify(data, null, 2));
  }

  async waiterLogin(dto: WaiterLoginDto) {
    await this.logger('waiterLogin', dto);
    
    if (!dto.pin) {
      // Just return a generic unauthorized instead of bad request to avoid confusing the frontend
      throw new UnauthorizedException('Staff PIN is required');
    }

    const whereClause: any = {
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

  async forgotPassword(email: string): Promise<{ token: string }> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.dataSource.getRepository(VerificationToken).save({
      userId: user.id,
      tokenHash,
      type: 'password_reset',
      expiresAt,
    });

    return { token: rawToken };
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.dataSource.getRepository(VerificationToken).findOne({
      where: {
        tokenHash,
        type: 'password_reset',
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    await this.dataSource.getRepository(User).update(verificationToken.userId, { password_hash: passwordHash });
    await this.dataSource.getRepository(VerificationToken).update(verificationToken.id, { isUsed: true });
  }

  async sendVerification(userId: string): Promise<{ otp: string }> {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.dataSource.getRepository(VerificationToken).save({
      userId,
      tokenHash,
      type: 'email_verification',
      expiresAt,
    });

    return { otp };
  }

  async verifyEmail(userId: string, otp: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    const verificationToken = await this.dataSource.getRepository(VerificationToken).findOne({
      where: {
        tokenHash,
        userId,
        type: 'email_verification',
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.dataSource.getRepository(User).update(userId, { email_verified_at: new Date() });
    await this.dataSource.getRepository(VerificationToken).update(verificationToken.id, { isUsed: true });
  }

  async refreshToken(userId: string) {
    const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.generateTokens(user);
  }

  async logout(userId: string) {
    return { success: true, message: 'Logged out successfully' };
  }

  async activate(dto: LoginDto) {
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

  private generateTokens(user: User) {
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
}
