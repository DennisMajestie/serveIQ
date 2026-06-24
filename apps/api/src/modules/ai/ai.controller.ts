import { Controller, Post, Get, UseGuards, Body, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateLogicDto } from './dto/generate-logic.dto';

@ApiTags('AI')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-logic')
  @ApiOperation({ summary: 'Generate perfect business logic using Nemotron AI' })
  @ApiBody({ type: GenerateLogicDto })
  @ApiResponse({ status: 201, description: 'Business logic generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateLogic(
    @Request() req: any,
    @Body() generateLogicDto: GenerateLogicDto,
  ) {
    const result = await this.aiService.generateLogic(generateLogicDto.prompt);
    return {
      success: true,
      data: result,
    };
  }

  @Get('analyze-api')
  @ApiOperation({ summary: 'Analyze API pros and cons for admin and waiter apps' })
  @ApiResponse({ status: 200, description: 'API analysis completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeApi() {
    const result = await this.aiService.analyzeApiProsCons();
    return {
      success: true,
      data: result,
    };
  }
}
