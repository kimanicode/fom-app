import { BadRequestException, Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class MediaService {
  private getCloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException('Cloudinary env vars missing');
    }
    return { cloudName, apiKey, apiSecret };
  }

  signUpload(params: { folder?: string }) {
    const { cloudName, apiKey, apiSecret } = this.getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const payload: Record<string, string | number> = { timestamp };
    if (params.folder) payload.folder = params.folder;

    const toSign = Object.keys(payload)
      .sort()
      .map((key) => `${key}=${payload[key]}`)
      .join('&');

    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: params.folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    };
  }
}
