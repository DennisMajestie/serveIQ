import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // No disk — files go to Cloudinary
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new Error('Only images (jpg, png, webp) and PDFs are allowed'), false);
        }
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
