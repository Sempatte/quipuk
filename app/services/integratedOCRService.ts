import env from '@/app/config/env';
import { ocrService } from './ocrService';
import { googleVisionOCR } from './googleVisionOCR';
import { ExtractedReceiptData, OCRResult } from './ocrService';

/**
 * Servicio OCR integrado que automáticamente usa Google Vision API 
 * cuando está configurado, o el simulador para desarrollo
 */
class IntegratedOCRService {    
  /**
   * Procesa una imagen usando el mejor servicio OCR disponible
   */
  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      let result: OCRResult;
      
      // Verificar si Google Vision está configurado y habilitado
      if (env.OCR_ENABLED && googleVisionOCR.isConfigured()) {
        console.log('🔍 Usando Google Vision API para OCR');
        result = await googleVisionOCR.processReceiptImage(imageUri);
        
        // Si Google Vision falla, usar el simulador como fallback
        if (!result.success) {
          console.log('⚠️ Google Vision falló, usando simulador OCR');
          result = await ocrService.processReceiptImage(imageUri);
        }
      } else {
        console.log('🔍 Usando simulador OCR (Google Vision no configurado)');
        result = await ocrService.processReceiptImage(imageUri);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Agregar tiempo de procesamiento al resultado
      return {
        ...result,
        processingTime,
      };
      
    } catch (error) {
      console.error('Error en servicio OCR integrado:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en OCR',
      };
    }
  }

  /**
   * Verifica qué servicio OCR está disponible
   */
  public getOCRServiceStatus(): {
    googleVisionConfigured: boolean;
    ocrEnabled: boolean;
    activeService: 'google-vision' | 'simulator';
  } {
    const googleVisionConfigured = googleVisionOCR.isConfigured();
    const ocrEnabled = env.OCR_ENABLED;
    
    return {
      googleVisionConfigured,
      ocrEnabled,
      activeService: (ocrEnabled && googleVisionConfigured) ? 'google-vision' : 'simulator',
    };
  }

  /**
   * Obtiene información de configuración para debugging
   */
  public getDebugInfo(): Record<string, any> {
    const status = this.getOCRServiceStatus();
    
    return {
      ...status,
      environment: env.ENV,
      hasApiKey: !!env.GOOGLE_VISION_API_KEY,
      apiKeyLength: env.GOOGLE_VISION_API_KEY?.length || 0,
    };
  }
}

// Exportar instancia singleton
export const integratedOCRService = new IntegratedOCRService();

// Re-exportar tipos para facilitar el uso
export type { ExtractedReceiptData, OCRResult };