import { __decorate } from "tslib";
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadController } from './upload.controller';
let UploadModule = class UploadModule {
};
UploadModule = __decorate([
    Module({
        imports: [
            MulterModule.register({
                storage: diskStorage({
                    destination: join(process.cwd(), 'uploads'),
                    filename: (_req, file, cb) => {
                        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                    },
                }),
                limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
                fileFilter: (_req, file, cb) => {
                    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
                    if (allowed.includes(extname(file.originalname).toLowerCase())) {
                        cb(null, true);
                    }
                    else {
                        cb(new Error('Only images (jpg, png, webp) and PDFs are allowed'), false);
                    }
                },
            }),
        ],
        controllers: [UploadController],
    })
], UploadModule);
export { UploadModule };
//# sourceMappingURL=upload.module.js.map