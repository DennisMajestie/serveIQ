import { createParamDecorator } from '@nestjs/common';
export const BranchId = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.branchId || request.user?.branchId;
});
//# sourceMappingURL=branch-id.decorator.js.map