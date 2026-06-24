import { __decorate, __metadata, __param } from "tslib";
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WaiterLoginDto } from './dto/waiter-login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async waiterLogin(payload) {
        const dto = new WaiterLoginDto();
        dto.pin = payload.pin || payload.passCode || payload.code || '';
        dto.branchId = payload.branchId || payload.branch_id || '';
        dto.businessId = payload.businessId || payload.business_id || '';
        return this.authService.waiterLogin(dto);
    }
    async staffLogin(payload) {
        return this.waiterLogin(payload);
    }
    async activate(loginDto) {
        return this.authService.activate(loginDto);
    }
};
__decorate([
    Post('register'),
    ApiOperation({
        summary: 'Register a new business and owner',
        description: 'Creates a new business account with the owner user. Upload logo/CAC first via POST /api/upload and pass the returned URLs here.',
    }),
    ApiResponse({ status: 201, description: 'Business and owner successfully created.' }),
    ApiResponse({ status: 400, description: 'Validation error — check the request body.' }),
    ApiResponse({ status: 409, description: 'Email already registered.' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Post('login'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Log in with email and password',
        description: 'Authenticates a user and returns a JWT access token. Use the token in the Authorize button (🔒) above to test protected endpoints.',
    }),
    ApiResponse({
        status: 200,
        description: 'Login successful — JWT access token returned.',
        schema: {
            example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
    }),
    ApiResponse({ status: 400, description: 'Validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid credentials.' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Post('waiter-login'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Waiter PIN login',
        description: 'Authenticates a waiter using their 4-digit PIN and branch ID or business ID.',
    }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "waiterLogin", null);
__decorate([
    Post('staff-login'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Staff PIN login (Legacy/Alias)',
        description: 'Authenticates a staff member using their 4-digit PIN and branch ID or business ID.',
    }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "staffLogin", null);
__decorate([
    Post('activate'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Device activation with admin credentials',
        description: 'Authenticates an admin user and returns business and branch information for terminal linkage.',
    }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "activate", null);
AuthController = __decorate([
    ApiTags('Authentication'),
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map