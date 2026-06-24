import { __decorate } from "tslib";
import { Injectable, ForbiddenException } from '@nestjs/common';
let BranchScopeGuard = class BranchScopeGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.branchId) {
            throw new ForbiddenException('Branch access required');
        }
        // If there's a branchId param, check it matches
        const branchIdFromParam = request.params.branchId || request.params.id;
        if (branchIdFromParam && branchIdFromParam !== user.branchId && user.role !== 'owner') {
            throw new ForbiddenException('Access to this branch is forbidden');
        }
        // Attach branchId to request for easy access in controllers
        request.branchId = user.branchId;
        return true;
    }
};
BranchScopeGuard = __decorate([
    Injectable()
], BranchScopeGuard);
export { BranchScopeGuard };
//# sourceMappingURL=branch-scope.guard.js.map