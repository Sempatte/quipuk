import env from '@/app/config/env';
import { ocrService } from './ocrService';
import { googleVisionOCR } from './googleVisionOCR';
import { ExtractedReceiptData, OCRResult } from './ocrService';

/**
 * Servicio OCR integrado que automáticamente usa Google Vision API 
 * cuando está configurado, o el simulador para desarrollo
 * Con logging detallado para debugging
 */
class IntegratedOCRService {    
  /**
   * Procesa una imagen usando el mejor servicio OCR disponible
   */
  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    console.log('🔍 [OCR] ============ INICIANDO PROCESAMIENTO OCR ============');
    console.log('🔍 [OCR] URI de imagen:', imageUri.substring(0, 100) + '...');
    console.log('🔍 [OCR] Timestamp:', new Date().toISOString());
    
    try {
      // Verificar que la URI no esté vacía
      if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
        console.error('❌ [OCR] URI de imagen inválida o vacía');
        return {
          success: false,
          error: 'URI de imagen inválida o vacía',
          processingTime: Date.now() - startTime,
        };
      }

      let result: OCRResult;
      const status = this.getOCRServiceStatus();
      
      console.log('🔍 [OCR] Estado del servicio:', {
        googleVisionConfigured: status.googleVisionConfigured,
        ocrEnabled: status.ocrEnabled,
        activeService: status.activeService,
        environment: env.ENV
      });
      
      // Verificar si Google Vision está configurado y habilitado
      if (env.OCR_ENABLED && googleVisionOCR.isConfigured()) {
        console.log('🔍 [OCR] ===== USANDO GOOGLE VISION API =====');
        
        try {
          result = await googleVisionOCR.processReceiptImage(imageUri);
          
          console.log('🔍 [OCR] Resultado de Google Vision:', {
            success: result.success,
            hasData: !!result.data,
            hasRawText: !!result.rawText,
            error: result.error?.substring(0, 100),
            processingTime: result.processingTime
          });
          
          // Si Google Vision falla, usar el simulador como fallback
          if (!result.success) {
            console.log('⚠️ [OCR] Google Vision falló, intentando con simulador OCR...');
            console.log('⚠️ [OCR] Error de Google Vision:', result.error);
            
            try {
              result = await ocrService.processReceiptImage(imageUri);
              
              console.log('🔍 [OCR] Resultado del simulador (fallback):', {
                success: result.success,
                hasData: !!result.data,
                hasRawText: !!result.rawText,
                error: result.error?.substring(0, 100),
                processingTime: result.processingTime
              });
              
              // Marcar que usamos fallback
              if (result.success && result.data) {
                result.data.confidence = Math.max((result.data.confidence || 0) - 10, 0); // Reducir confianza por ser fallback
              }
            } catch (simulatorError) {
              console.error('💥 [OCR] Error también en simulador:', simulatorError);
              return {
                success: false,
                error: `Ambos servicios OCR fallaron. Google Vision: ${result.error}. Simulador: ${simulatorError instanceof Error ? simulatorError.message : 'Error desconocido'}`,
                processingTime: Date.now() - startTime,
              };
            }
          } else {
            console.log('✅ [OCR] Google Vision procesó exitosamente');
          }
        } catch (googleVisionError) {
          console.error('💥 [OCR] Error crítico en Google Vision:', googleVisionError);
          
          // Fallback al simulador
          console.log('🔄 [OCR] Intentando fallback a simulador...');
          try {
            result = await ocrService.processReceiptImage(imageUri);
            console.log('✅ [OCR] Simulador funcionó como fallback');
          } catch (simulatorError) {
            console.error('💥 [OCR] Error también en simulador fallback:', simulatorError);
            return {
              success: false,
              error: `Error crítico en ambos servicios OCR`,
              processingTime: Date.now() - startTime,
            };
          }
        }
      } else {
        console.log('🔍 [OCR] ===== USANDO SIMULADOR OCR =====');
        console.log('🔍 [OCR] Razón:', !env.OCR_ENABLED ? 'OCR_ENABLED = false' : 'Google Vision no configurado');
        
        try {
          result = await ocrService.processReceiptImage(imageUri);
          
          console.log('🔍 [OCR] Resultado del simulador:', {
            success: result.success,
            hasData: !!result.data,
            hasRawText: !!result.rawText,
            error: result.error?.substring(0, 100),
            processingTime: result.processingTime
          });
        } catch (simulatorError) {
          console.error('💥 [OCR] Error en simulador:', simulatorError);
          return {
            success: false,
            error: `Error en simulador OCR: ${simulatorError instanceof Error ? simulatorError.message : 'Error desconocido'}`,
            processingTime: Date.now() - startTime,
          };
        }
      }
      
      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;
      
      console.log(`🔍 [OCR] ===== PROCESAMIENTO COMPLETADO =====`);
      console.log(`🔍 [OCR] Tiempo total: ${totalProcessingTime}ms`);
      console.log(`🔍 [OCR] Resultado final:`, {
        success: result.success,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        confidence: result.data?.confidence,
        amount: result.data?.amount,
        category: result.data?.category,
        merchantName: result.data?.merchantName,
        hasDescription: !!result.data?.description,
        hasRawText: !!result.rawText,
        rawTextLength: result.rawText?.length || 0,
        error: result.error
      });
      
      // Agregar tiempo de procesamiento al resultado
      const finalResult = {
        ...result,
        processingTime: totalProcessingTime,
      };
      
      // Validación final de datos
      if (finalResult.success && finalResult.data) {
        console.log('✅ [OCR] Validando datos extraídos...');
        
        // Verificar que tengamos al menos algunos datos útiles
        const hasUsefulData = !!(
          finalResult.data.amount || 
          finalResult.data.merchantName || 
          finalResult.data.category || 
          finalResult.data.description
        );
        
        if (!hasUsefulData) {
          console.log('⚠️ [OCR] No se extrajeron datos útiles, marcando como fallo');
          return {
            success: false,
            error: 'No se pudieron extraer datos útiles del comprobante',
            rawText: finalResult.rawText,
            processingTime: totalProcessingTime,
          };
        }
        
        console.log('✅ [OCR] Datos válidos encontrados');
      }
      
      return finalResult;
      
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error('💥 [OCR] ERROR CRÍTICO EN SERVICIO OCR INTEGRADO:', error);
      console.error('💥 [OCR] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      return {
        success: false,
        error: error instanceof Error ? `Error crítico: ${error.message}` : 'Error crítico desconocido en OCR',
        processingTime: errorTime,
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
    
    const status = {
      googleVisionConfigured,
      ocrEnabled,
      activeService: (ocrEnabled && googleVisionConfigured) ? 'google-vision' as const : 'simulator' as const,
    };
    
    console.log('🔍 [OCR] getOCRServiceStatus:', status);
    
    return status;
  }

  /**
   * Obtiene información de configuración para debugging
   */
  public getDebugInfo(): Record<string, any> {
    const status = this.getOCRServiceStatus();
    
    const debugInfo = {
      ...status,
      environment: env.ENV,
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
      hasApiKey: !!env.GOOGLE_VISION_API_KEY,
      apiKeyLength: env.GOOGLE_VISION_API_KEY?.length || 0,
      timestamp: new Date().toISOString(),
    };
    
    console.log('🔍 [OCR] getDebugInfo:', debugInfo);
    
    return debugInfo;
  }

  /**
   * Método de test para verificar que el servicio funciona
   */
  public async testOCRService(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('🧪 [OCR] ===== INICIANDO TEST DEL SERVICIO OCR =====');
    
    try {
      const status = this.getOCRServiceStatus();
      const debugInfo = this.getDebugInfo();
      
      // Test básico de configuración
      if (!status.ocrEnabled) {
        return {
          success: false,
          message: 'OCR está deshabilitado en la configuración',
          details: { status, debugInfo }
        };
      }
      
      if (status.activeService === 'google-vision') {
        if (!status.googleVisionConfigured) {
          return {
            success: false,
            message: 'Google Vision API no está configurado correctamente',
            details: { status, debugInfo }
          };
        }
        
        console.log('✅ [OCR] Configuración de Google Vision válida');
      }
      
      console.log('✅ [OCR] Test básico de configuración exitoso');
      
      return {
        success: true,
        message: `Servicio OCR configurado correctamente (${status.activeService})`,
        details: { status, debugInfo }
      };
      
    } catch (error) {
      console.error('💥 [OCR] Error en test del servicio:', error);
      return {
        success: false,
        message: `Error en test: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }
}

// Exportar instancia singleton
export const integratedOCRService = new IntegratedOCRService();

// Re-exportar tipos para facilitar el uso
export type { ExtractedReceiptData, OCRResult };