import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

class CryptoService {
  private readonly MASTER_KEY = 'quipuk_master_key_v1';
  
  // Generar salt único
  async generateSalt(): Promise<string> {
    const salt = await Crypto.getRandomBytesAsync(16);
    return bytesToHex(salt);
  }

  // Hash del PIN con salt (SHA-256)
  async hashPin(pin: string, salt: string): Promise<string> {
    const data = pin + salt;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  }

  // Verificar PIN
  async verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
    const hashedPin = await this.hashPin(pin, salt);
    return hashedPin === hash;
  }

  // Generar token de recuperación
  async generateRecoveryToken(): Promise<string> {
    const token = await Crypto.getRandomBytesAsync(32);
    return bytesToHex(token);
  }

  // Hash del token de recuperación
  async hashRecoveryToken(token: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
  }

  // Validar fuerza del PIN
  validatePinStrength(pin: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (pin.length < 4) {
      errors.push('PIN debe tener al menos 4 dígitos');
    }
    
    if (pin.length > 8) {
      errors.push('PIN no puede tener más de 8 dígitos');
    }
    
    if (!/^\d+$/.test(pin)) {
      errors.push('PIN solo puede contener números');
    }
    
    // Verificar patrones débiles
    if (this.isWeakPattern(pin)) {
      errors.push('PIN muy fácil de adivinar. Usa una combinación más segura');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isWeakPattern(pin: string): boolean {
    const weakPatterns = [
      /^1234/, /^4321/, /^0000/, /^1111/, /^2222/, /^3333/, 
      /^4444/, /^5555/, /^6666/, /^7777/, /^8888/, /^9999/,
      /^0123/, /^1357/, /^2468/, /^9876/, /^5432/
    ];
    
    return weakPatterns.some(pattern => pattern.test(pin));
  }

  // Cifrado simulado: solo almacena el dato en SecureStore (no cifrado real)
  async encryptLocalData(data: string): Promise<string> {
    try {
      await SecureStore.setItemAsync(this.MASTER_KEY, data);
      return data;
    } catch (error) {
      console.error('Error encrypting local data:', error);
      throw new Error('Error al cifrar datos');
    }
  }

  // Descifrado simulado: solo recupera el dato de SecureStore
  async decryptLocalData(): Promise<string> {
    try {
      const data = await SecureStore.getItemAsync(this.MASTER_KEY);
      if (!data) {
        throw new Error('No se encontraron datos');
      }
      return data;
    } catch (error) {
      console.error('Error decrypting local data:', error);
      throw new Error('Error al descifrar datos');
    }
  }
}

export const cryptoService = new CryptoService();