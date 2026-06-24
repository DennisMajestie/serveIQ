import { __decorate } from "tslib";
import { Catch, HttpException, HttpStatus, } from '@nestjs/common';
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
        const message = typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? exceptionResponse.message || exceptionResponse.error
            : exception instanceof Error
                ? exception.message
                : 'Internal server error';
        response.status(status).json({
            success: false,
            data: null,
            meta: {
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message: Array.isArray(message) ? message : [message],
            },
        });
    }
};
HttpExceptionFilter = __decorate([
    Catch()
], HttpExceptionFilter);
export { HttpExceptionFilter };
//# sourceMappingURL=http-exception.filter.js.map