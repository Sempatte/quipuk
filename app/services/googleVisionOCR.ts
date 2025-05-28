import env from '@/app/config/env';
import { ExtractedReceiptData, OCRResult } from './ocrService';

// Configuración para Google Vision API
const GOOGLE_VISION_API_KEY = env.GOOGLE_VISION_API_KEY || '';
const GOOGLE_VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

/**
 * Servicio OCR real usando Google Vision API
 * Solo para uso en producción con API key válida
 */
class GoogleVisionOCR {
  /**
   * Verifica si la API está configurada correctamente
   */
  public isConfigured(): boolean {
    return !!GOOGLE_VISION_API_KEY && GOOGLE_VISION_API_KEY.length > 0;
  }

  /**
   * Procesa una imagen usando Google Vision API
   */
  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Google Vision API no está configurada. Usando simulación OCR.',
        processingTime: Date.now() - startTime,
      };
    }

    try {
      // Convertir imagen a base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      if (!base64Image) {
        return {
          success: false,
          error: 'No se pudo convertir la imagen a base64',
          processingTime: Date.now() - startTime,
        };
      }

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

      // Realizar llamada a la API
      const response = await fetch(GOOGLE_VISION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now();

      // Procesar respuesta
      if (result.responses && result.responses[0] && result.responses[0].textAnnotations) {
        const detectedText = result.responses[0].textAnnotations[0].description;
        
        if (detectedText) {
          // Usar el parser existente para extraer datos estructurados
          const extractedData = this.parseReceiptText(detectedText);
          
          return {
            success: true,
            data: extractedData,
            rawText: detectedText,
            processingTime: endTime - startTime,
          };
        }
      }

      return {
        success: false,
        error: 'No se detectó texto en la imagen',
        processingTime: endTime - startTime,
      };
    } catch (error) {
      console.error('Error con Google Vision API:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Convierte imagen a base64 para envío a la API
   */
  private async convertImageToBase64(imageUri: string): Promise<string | null> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remover el prefijo data:image/...;base64,
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error convirtiendo imagen a base64:', error);
      return null;
    }
  }

  /**
   * Parser de texto similar al servicio OCR principal
   * Reutiliza la lógica de extracción de datos
   */
  private parseReceiptText(text: string): ExtractedReceiptData {
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
          break;
        }
      }
    }

    // Extraer comercio
    for (const pattern of patterns.merchant) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.merchantName = match[1].trim();
        result.description = `Compra en ${result.merchantName}`;
        result.confidence += 30;
        break;
      }
    }

    // Extraer fecha
    for (const pattern of patterns.date) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          const dateStr = match[1];
          const date = new Date(dateStr.replace(/\//g, '-'));
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString();
            result.confidence += 20;
            break;
          }
        } catch (error) {
          // Continuar con el siguiente patrón
        }
      }
    }

    // Determinar categoría
    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          result.category = category;
          result.confidence += 10;
          break;
        }
      }
      if (result.category) break;
    }

    // Asignar categoría por defecto
    if (!result.category) {
      result.category = 'Otros';
    }

    // Generar descripción si no existe
    if (!result.description) {
      result.description = result.merchantName 
        ? `Gasto en ${result.merchantName}`
        : 'Gasto escaneado desde comprobante';
    }

    return result;
  }
}

// Exportar instancia singleton
export const googleVisionOCR = new GoogleVisionOCR();