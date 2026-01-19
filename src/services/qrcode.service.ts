import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * QR Code generation service
 * Generates QR codes for diploma certificates
 */
class QRCodeService {
  /**
   * Generates a unique hash for a certificate
   * @returns A 32-character hexadecimal hash
   */
  generateHash(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generates a QR code from a hash
   * @param qrHash - Unique certificate hash
   * @returns A data URL containing the QR code image
   */
  async generateQRCode(qrHash: string): Promise<string> {
    try {
      // Public URL where the certificate can be verified
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/verify/${qrHash}`;
      
      // QR code generation in PNG format
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      throw new Error('Unable to generate QR code');
    }
  }

  /**
   * Generates a QR code as a Buffer (PNG binary) for PDF embedding
   * @param qrHash - Unique certificate hash
   * @returns A buffer containing the QR code PNG image
   */
  async generateQRCodeBuffer(qrHash: string): Promise<Buffer> {
    try {
      // Public URL where the certificate can be verified
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/verify/${qrHash}`;
      
      // QR code generation as Buffer (PNG format)
      // Use toBuffer with options only (no callback for Promise)
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        QRCode.toBuffer(verificationUrl, {
          errorCorrectionLevel: 'H',
          type: 'png',
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        } as any, (err, buf) => {
          if (err) reject(err);
          else resolve(buf);
        });
      });

      return buffer;
    } catch (error) {
      console.error('❌ Error generating QR code buffer:', error);
      throw new Error('Unable to generate QR code');
    }
  }

  /**
   * Generates a QR code and saves its URL
   * This method generates both the hash and QR code
   * @returns Object containing hash and QR code URL
   */
  async generateQRCodeWithHash(): Promise<{ qrHash: string; qrCodeUrl: string }> {
    const qrHash = this.generateHash();
    const qrCodeUrl = await this.generateQRCode(qrHash);

    return {
      qrHash,
      qrCodeUrl,
    };
  }

  /**
   * Extracts hash from a verification URL
   * Useful for validating verification requests
   * @param url - Verification URL
   * @returns Extracted hash or null
   */
  extractHashFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const hash = urlParts[urlParts.length - 1];
      // Check if it's a valid hash (hexadecimal, 32 characters)
      if (/^[a-f0-9]{32}$/i.test(hash)) {
        return hash;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export default new QRCodeService();

