import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';

const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  try {
    mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory at: ${uploadsDir}`);
  } catch (err) {
    console.error(`Failed to create uploads directory at ${uploadsDir}:`, err);
  }
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
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
