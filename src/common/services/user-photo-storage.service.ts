import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

type SupportedImageMime = 'image/jpeg' | 'image/jpg' | 'image/png';

@Injectable()
export class UserPhotoStorageService {
  private readonly uploadDirAbs = path.join(
    process.cwd(),
    'uploads',
    'user-photos',
  );

  private dirReady: Promise<void> | null = null;

  private ensureDir(): Promise<void> {
    if (!this.dirReady) {
      this.dirReady = fs
        .mkdir(this.uploadDirAbs, { recursive: true })
        .then(() => undefined);
    }
    return this.dirReady;
  }

  private extensionFromMime(mime: string): 'jpg' | 'png' {
    const normalized = mime.toLowerCase();
    if (normalized === 'image/png') return 'png';
    return 'jpg';
  }

  isDataUrl(value?: string | null): boolean {
    return typeof value === 'string' && value.startsWith('data:');
  }

  /**
   * Returns a relative path to store in DB (e.g. "uploads/user-photos/<id>.jpg")
   */
  async saveUserPhotoFromBuffer(
    userId: string,
    buffer: Buffer,
    mimetype: SupportedImageMime | string,
  ): Promise<string> {
    await this.ensureDir();

    const ext = this.extensionFromMime(mimetype);
    const filename = `${userId}.${ext}`;
    const abs = path.join(this.uploadDirAbs, filename);
    await fs.writeFile(abs, buffer);

    return path.posix.join('uploads', 'user-photos', filename);
  }

  async saveUserPhotoFromBase64(
    userId: string,
    base64: string,
    mimetype: SupportedImageMime | string,
  ): Promise<string> {
    const buffer = Buffer.from(base64, 'base64');
    return this.saveUserPhotoFromBuffer(userId, buffer, mimetype);
  }

  /**
   * Parses a data URL "data:<mime>;base64,<data>" and persists it as file.
   * Returns a relative file path to store in DB.
   */
  async saveUserPhotoFromDataUrl(
    userId: string,
    dataUrl: string,
  ): Promise<{ path: string; mimetype: string }> {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    const [, mimetype, base64] = matches;
    const p = await this.saveUserPhotoFromBase64(userId, base64, mimetype);
    return { path: p, mimetype };
  }

  toAbsolutePath(relativePath: string): string {
    // Allow already-absolute values (defensive)
    if (path.isAbsolute(relativePath)) return relativePath;
    return path.join(process.cwd(), relativePath);
  }

  contentTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    return 'image/jpeg';
  }
}

