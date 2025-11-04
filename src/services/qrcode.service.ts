import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Service de génération de QR codes
 * Génère des codes QR pour les certificats de diplômes
 */
class QRCodeService {
  /**
   * Génère un hash unique pour un certificat
   * @returns Un hash hexadécimal de 32 caractères
   */
  generateHash(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Génère un code QR à partir d'un hash
   * @param qrHash - Le hash unique du certificat
   * @returns Une URL de données (data URL) contenant l'image du QR code
   */
  async generateQRCode(qrHash: string): Promise<string> {
    try {
      // URL publique où le certificat peut être vérifié
      const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/verify/${qrHash}`;
      
      // Génération du QR code en format PNG
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H', // Haute correction d'erreurs
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',  // Couleur des carrés
          light: '#FFFFFF', // Couleur du fond
        },
        width: 300, // Largeur en pixels
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du QR code:', error);
      throw new Error('Impossible de générer le QR code');
    }
  }

  /**
   * Génère un QR code et sauvegarde son URL
   * Cette méthode génère à la fois le hash et le QR code
   * @returns Un objet contenant le hash et l'URL du QR code
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
   * Extrait le hash d'une URL de vérification
   * Utile pour valider les requêtes de vérification
   * @param url - L'URL de vérification
   * @returns Le hash extrait ou null
   */
  extractHashFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const hash = urlParts[urlParts.length - 1];
      // Vérifier que c'est un hash valide (hexadecimal, 32 caractères)
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

