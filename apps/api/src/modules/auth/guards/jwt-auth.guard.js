import { __decorate } from "tslib";
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
let JwtAuthGuard = class JwtAuthGuard extends AuthGuard('jwt') {
};
JwtAuthGuard = __decorate([
    Injectable()
], JwtAuthGuard);
export { JwtAuthGuard };
//# sourceMappingURL=jwt-auth.guard.js.map