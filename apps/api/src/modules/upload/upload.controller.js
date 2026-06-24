import { __decorate, __metadata, __param } from "tslib";
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
let UploadController = class UploadController {
    uploadFile(file) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        const url = `/uploads/${file.originalname}`;
        return { url };
    }
};
__decorate([
    Post(),
    UseInterceptors(FileInterceptor('file')),
    ApiConsumes('multipart/form-data'),
    ApiOperation({ summary: 'Upload a file (image or PDF). Returns the file URL to use in other endpoints.' }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadFile", null);
UploadController = __decorate([
    ApiTags('Upload'),
    Controller({ path: 'upload', version: '1' })
], UploadController);
export { UploadController };
//# sourceMappingURL=upload.controller.js.map