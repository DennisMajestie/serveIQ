import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WaiterLoginDto } from './dto/waiter-login.dto';
import { ActivateDto } from './dto/activate.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new business and owner',
    description:
      'Creates a new business account with the owner user. Upload logo/CAC first via POST /api/upload and pass the returned URLs here.',
  })
  @ApiResponse({ status: 201, description: 'Business and owner successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation error — check the request body.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Authenticates a user and returns a JWT access token. Use the token in the Authorize button (🔒) above to test protected endpoints.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful — JWT access token returned.',
    schema: {
      example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('waiter-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Waiter PIN login',
    description:
      'Authenticates a waiter using their 4-digit PIN and branch ID or business ID.',
  })
  async waiterLogin(@Body() payload: any) {
    const dto = new WaiterLoginDto();
    dto.pin = payload.pin || payload.passCode || payload.code || '';
    dto.branchId = payload.branchId || payload.branch_id || '';
    dto.businessId = payload.businessId || payload.business_id || '';
    
    return this.authService.waiterLogin(dto);
  }

  @Post('staff-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Staff PIN login (Legacy/Alias)',
    description:
      'Authenticates a staff member using their 4-digit PIN and branch ID or business ID.',
  })
  async staffLogin(@Body() payload: any) {
    return this.waiterLogin(payload);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiResponse({ status: 200, description: 'Reset token generated.' })
  @ApiResponse({ status: 404, description: 'Email not found.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent.' })
  async sendVerification(@Request() req: any) {
    return this.authService.sendVerification(req.user.userId);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  async verifyEmail(@Request() req: any, @Body() dto: { otp: string }) {
    return this.authService.verifyEmail(req.user.userId, dto.otp);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed.' })
  async refresh(@Request() req: any) {
    return this.authService.refreshToken(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate token' })
  @ApiResponse({ status: 200, description: 'Logged out.' })
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.userId);
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin terminal activation v2',
    description:
      'Authenticates an OWNER or SUPER_ADMIN and returns business/branch info for linking a terminal.',
  })
  async activate(@Body() dto: ActivateDto) {
    const loginDto: LoginDto = { email: dto.email, password: dto.password };
    return this.authService.activate(loginDto);
  }
}
