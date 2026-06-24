import { __decorate } from "tslib";
import { Injectable, } from '@nestjs/common';
import { map } from 'rxjs/operators';
let TransformInterceptor = class TransformInterceptor {
    intercept(context, next) {
        return next.handle().pipe(map((data) => ({
            success: true,
            data,
        })));
    }
};
TransformInterceptor = __decorate([
    Injectable()
], TransformInterceptor);
export { TransformInterceptor };
//# sourceMappingURL=transform.interceptor.js.map