import { __decorate, __metadata, __param } from "tslib";
import { Controller, Post, Get, UseGuards, Body, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateLogicDto } from './dto/generate-logic.dto';
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateLogic(req, generateLogicDto) {
        const result = await this.aiService.generateLogic(generateLogicDto.prompt);
        return {
            success: true,
            data: result,
        };
    }
    async analyzeApi() {
        const result = await this.aiService.analyzeApiProsCons();
        return {
            success: true,
            data: result,
        };
    }
};
__decorate([
    Post('generate-logic'),
    ApiOperation({ summary: 'Generate perfect business logic using Nemotron AI' }),
    ApiBody({ type: GenerateLogicDto }),
    ApiResponse({ status: 201, description: 'Business logic generated successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GenerateLogicDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateLogic", null);
__decorate([
    Get('analyze-api'),
    ApiOperation({ summary: 'Analyze API pros and cons for admin and waiter apps' }),
    ApiResponse({ status: 200, description: 'API analysis completed successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzeApi", null);
AiController = __decorate([
    ApiTags('AI'),
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard),
    Controller('ai'),
    __metadata("design:paramtypes", [AiService])
], AiController);
export { AiController };
//# sourceMappingURL=ai.controller.js.map