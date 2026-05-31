import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('uploads')
export class UploadsController {
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException({ errors: { file: 'required' } });
    return {
      url: `/api/uploads/${file.filename}`,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Get(':filename')
  fetch(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    const safe = path.basename(filename);
    const filepath = path.join(UPLOAD_DIR, safe);
    if (!fs.existsSync(filepath)) {
      throw new BadRequestException({ errors: { filename: 'notFound' } });
    }
    const ext = path.extname(safe).toLowerCase();
    const mime: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif',
      '.webp': 'image/webp', '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf', '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg', '.zip': 'application/zip',
    };
    if (mime[ext]) res.set('Content-Type', mime[ext]);
    res.set('Content-Disposition', `inline; filename="${safe}"`);
    return new StreamableFile(fs.createReadStream(filepath));
  }
}
