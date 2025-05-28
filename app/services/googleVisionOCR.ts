import env from '@/app/config/env';
import { ExtractedReceiptData, OCRResult } from './ocrService';

// Configuración para Google Vision API
const GOOGLE_VISION_API_KEY = env.GOOGLE_VISION_API_KEY || '';
const GOOGLE_VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

/**
 * Servicio OCR real usando Google Vision API
 * Con logging detallado para debugging
 */
class GoogleVisionOCR {
  /**
   * Verifica si la API está configurada correctamente
   */
  public isConfigured(): boolean {
    const isConfigured = !!GOOGLE_VISION_API_KEY && GOOGLE_VISION_API_KEY.length > 10;
    console.log(`🔍 [GoogleVision] isConfigured: ${isConfigured}, keyLength: ${GOOGLE_VISION_API_KEY?.length || 0}`);
    return isConfigured;
  }

  /**
   * Procesa una imagen usando Google Vision API
   */
  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    console.log('🔍 [GoogleVision] Iniciando procesamiento de imagen:', imageUri.substring(0, 80) + '...');
    
    if (!this.isConfigured()) {
      console.log('❌ [GoogleVision] API no configurada');
      return {
        success: false,
        error: 'Google Vision API no está configurada. Usando simulación OCR.',
        processingTime: Date.now() - startTime,
      };
    }

    try {
      console.log('🔍 [GoogleVision] Convirtiendo imagen a base64...');
      
      // Convertir imagen a base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      if (!base64Image) {
        console.error('❌ [GoogleVision] No se pudo convertir imagen a base64');
        return {
          success: false,
          error: 'No se pudo convertir la imagen a base64',
          processingTime: Date.now() - startTime,
        };
      }

      console.log(`🔍 [GoogleVision] Base64 generado exitosamente, tamaño: ${base64Image.length} caracteres`);

      // Preparar request para Google Vision API
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      };

      console.log('🔍 [GoogleVision] Enviando request a Google Vision API...');
      console.log('🔍 [GoogleVision] URL:', GOOGLE_VISION_URL.replace(GOOGLE_VISION_API_KEY, '***API_KEY***'));

      // Realizar llamada a la API
      const response = await fetch(GOOGLE_VISION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`🔍 [GoogleVision] Respuesta recibida: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [GoogleVision] Error en API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 300) + (errorText.length > 300 ? '...' : '')
        });

        // Mensajes de error específicos
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        switch (response.status) {
          case 403:
            errorMessage = 'API Key inválida o sin permisos. Verifica que Cloud Vision API esté habilitada.';
            break;
          case 400:
            errorMessage = 'Solicitud inválida. Verifica el formato de la imagen.';
            break;
          case 429:
            errorMessage = 'Límite de cuota excedido. Intenta más tarde.';
            break;
          case 401:
            errorMessage = 'API Key no válida o faltante.';
            break;
        }
        
        throw new Error(errorMessage);
      }

      console.log('🔍 [GoogleVision] Parseando respuesta JSON...');
      const result = await response.json();
      const endTime = Date.now();

      console.log('🔍 [GoogleVision] Respuesta parseada exitosamente');
      console.log('🔍 [GoogleVision] Estructura de respuesta:', {
        hasResponses: !!result.responses,
        responsesLength: result.responses?.length || 0,
        hasFirstResponse: !!(result.responses && result.responses[0]),
        hasTextAnnotations: !!(result.responses && result.responses[0] && result.responses[0].textAnnotations),
        textAnnotationsLength: result.responses?.[0]?.textAnnotations?.length || 0
      });

      // Verificar si hay errores en la respuesta
      if (result.error) {
        console.error('❌ [GoogleVision] Error en respuesta de API:', result.error);
        return {
          success: false,
          error: `Google Vision Error: ${result.error.message || 'Error desconocido'}`,
          processingTime: endTime - startTime,
        };
      }

      // Procesar respuesta
      if (result.responses && result.responses[0]) {
        const apiResponse = result.responses[0];
        
        if (apiResponse.error) {
          console.error('❌ [GoogleVision] Error en respuesta individual:', apiResponse.error);
          return {
            success: false,
            error: `Vision API Error: ${apiResponse.error.message}`,
            processingTime: endTime - startTime,
          };
        }

        if (apiResponse.textAnnotations && apiResponse.textAnnotations[0]) {
          const detectedText = apiResponse.textAnnotations[0].description;
          
          console.log(`✅ [GoogleVision] Texto detectado exitosamente:`);
          console.log(`📄 [GoogleVision] Longitud del texto: ${detectedText?.length || 0} caracteres`);
          console.log(`📄 [GoogleVision] Primeros 200 caracteres:`, detectedText?.substring(0, 200) + '...');
          
          if (detectedText && detectedText.trim().length > 0) {
            console.log('🔍 [GoogleVision] Iniciando parsing de texto...');
            // Usar el parser existente para extraer datos estructurados
            const extractedData = this.parseReceiptText(detectedText);
            
            console.log('✅ [GoogleVision] Datos extraídos:', {
              amount: extractedData.amount,
              merchantName: extractedData.merchantName,
              category: extractedData.category,
              confidence: extractedData.confidence,
              hasDescription: !!extractedData.description,
              hasDate: !!extractedData.date
            });
            
            return {
              success: true,
              data: extractedData,
              rawText: detectedText,
              processingTime: endTime - startTime,
            };
          } else {
            console.log('⚠️ [GoogleVision] Texto detectado está vacío');
          }
        } else {
          console.log('⚠️ [GoogleVision] No hay textAnnotations en la respuesta');
        }
      } else {
        console.log('⚠️ [GoogleVision] No hay responses en el resultado');
      }

      console.log('❌ [GoogleVision] No se detectó texto válido en la imagen');
      return {
        success: false,
        error: 'No se detectó texto en la imagen',
        processingTime: endTime - startTime,
      };
    } catch (error) {
      console.error('💥 [GoogleVision] Error general:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Convierte imagen a base64 para envío a la API - MEJORADA
   */
  private async convertImageToBase64(imageUri: string): Promise<string | null> {
    try {
      console.log('🔍 [GoogleVision] Descargando imagen desde URI...');
      console.log('🔍 [GoogleVision] URI:', imageUri.substring(0, 80) + '...');
      
      const response = await fetch(imageUri);
      
      console.log(`🔍 [GoogleVision] Respuesta de descarga: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error('❌ [GoogleVision] Error descargando imagen:', response.status);
        return null;
      }
      
      const blob = await response.blob();
      
      console.log(`🔍 [GoogleVision] Blob obtenido - tamaño: ${blob.size} bytes, tipo: ${blob.type}`);
      
      if (blob.size === 0) {
        console.error('❌ [GoogleVision] Blob está vacío');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          try {
            const base64data = reader.result as string;
            
            if (!base64data || typeof base64data !== 'string') {
              console.error('❌ [GoogleVision] FileReader no devolvió datos válidos');
              reject(new Error('FileReader no devolvió datos válidos'));
              return;
            }
            
            // Remover el prefijo data:image/...;base64,
            const base64Parts = base64data.split(',');
            if (base64Parts.length < 2) {
              console.error('❌ [GoogleVision] Formato base64 inválido');
              reject(new Error('Formato base64 inválido'));
              return;
            }
            
            const base64 = base64Parts[1];
            console.log(`✅ [GoogleVision] Base64 convertido exitosamente - longitud: ${base64.length}`);
            resolve(base64);
          } catch (error) {
            console.error('❌ [GoogleVision] Error procesando base64:', error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          console.error('❌ [GoogleVision] Error en FileReader:', error);
          reject(error);
        };
        
        console.log('🔍 [GoogleVision] Iniciando conversión a base64...');
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('💥 [GoogleVision] Error general convirtiendo imagen a base64:', error);
      return null;
    }
  }

  /**
   * Parser de texto mejorado - similar al servicio OCR principal
   */
  private parseReceiptText(text: string): ExtractedReceiptData {
    console.log('🔍 [GoogleVision] Iniciando parsing de texto...');
    
    // Patrones regex para identificar diferentes tipos de datos
    const patterns = {
      amount: [
        /S\/\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:total|subtotal|importe|monto)[:\s]*S\/?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*(?:soles|S\/)/gi,
      ],
      date: [
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        /(\d{1,2}-\d{1,2}-\d{4})/g,
        /(\d{4}-\d{1,2}-\d{1,2})/g,
      ],
      merchant: [
        /^([A-Z\s]{3,}(?:S\.A\.C?|S\.R\.L?|E\.I\.R\.L?)?)/m,
        /RUC[:\s]*\d{11}[^\r\n]*([A-Z][A-Za-z\s]{3,})/gi,
      ],
    };

    const categoryKeywords = {
      'Comida': ['restaurant', 'comida', 'food', 'burger', 'pizza', 'pollo', 'menu'],
      'Transporte': ['taxi', 'uber', 'bus', 'combustible', 'gasolina', 'grifo'],
      'Super': ['supermercado', 'market', 'plaza vea', 'wong', 'tottus', 'metro'],
      'Salud': ['farmacia', 'clinica', 'hospital', 'medico', 'medicamento'],
      'Hogar': ['ferreteria', 'sodimac', 'maestro', 'promart', 'decoracion'],
      'Teléfono': ['claro', 'movistar', 'entel', 'bitel', 'telefono', 'internet'],
      'Otros': ['tienda', 'compra', 'venta', 'servicio'],
    };

    const result: ExtractedReceiptData = {
      confidence: 0,
    };

    // Extraer monto
    console.log('🔍 [GoogleVision] Buscando montos...');
    for (const pattern of patterns.amount) {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 0) {
        let maxAmount = 0;
        for (const match of matches) {
          const amountStr = match[1].replace(/,/g, '');
          const amount = parseFloat(amountStr);
          if (!isNaN(amount) && amount > maxAmount) {
            maxAmount = amount;
          }
        }
        if (maxAmount > 0) {
          result.amount = maxAmount;
          result.confidence += 40;
          console.log(`✅ [GoogleVision] Monto encontrado: S/ ${maxAmount}`);
          break;
        }
      }
    }

    // Extraer comercio
    console.log('🔍 [GoogleVision] Buscando nombre de comercio...');
    for (const pattern of patterns.merchant) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.merchantName = match[1].trim();
        result.description = `Compra en ${result.merchantName}`;
        result.confidence += 30;
        console.log(`✅ [GoogleVision] Comercio encontrado: ${result.merchantName}`);
        break;
      }
    }

    // Extraer fecha
    console.log('🔍 [GoogleVision] Buscando fecha...');
    for (const pattern of patterns.date) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const dateStr = match[1];
          const date = new Date(dateStr.replace(/\//g, '-'));
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString();
            result.confidence += 20;
            console.log(`✅ [GoogleVision] Fecha encontrada: ${dateStr}`);
            break;
          }
        } catch (error) {
          console.log('⚠️ [GoogleVision] Error parseando fecha:', error);
        }
      }
    }

    // Determinar categoría
    console.log('🔍 [GoogleVision] Determinando categoría...');
    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          result.category = category;
          result.confidence += 10;
          console.log(`✅ [GoogleVision] Categoría encontrada: ${category} (keyword: ${keyword})`);
          break;
        }
      }
      if (result.category) break;
    }

    // Asignar categoría por defecto
    if (!result.category) {
      result.category = 'Otros';
      console.log('📝 [GoogleVision] Asignando categoría por defecto: Otros');
    }

    // Generar descripción si no existe
    if (!result.description) {
      result.description = result.merchantName 
        ? `Gasto en ${result.merchantName}`
        : 'Gasto escaneado desde comprobante';
      console.log(`📝 [GoogleVision] Descripción generada: ${result.description}`);
    }

    console.log(`✅ [GoogleVision] Parsing completado - Confianza: ${result.confidence}%`);

    return result;
  }
}

// Exportar instancia singleton
export const googleVisionOCR = new GoogleVisionOCR();