import * as ImagePicker from 'expo-image-picker';

// Interfaz para los datos extraídos del comprobante
export interface ExtractedReceiptData {
  amount?: number;
  merchantName?: string;
  date?: string;
  category?: string;
  description?: string;
  confidence: number; // Nivel de confianza en la extracción (0-100)
}

// Interfaz para el resultado del procesamiento
export interface OCRResult {
  success: boolean;
  data?: ExtractedReceiptData;
  error?: string;
  rawText?: string; // Texto completo extraído para debugging
  processingTime?: number; // Tiempo de procesamiento en milisegundos
}

/**
 * Servicio OCR para procesar comprobantes y extraer información relevante
 * Utiliza patrones de regex avanzados y heurísticas para identificar datos
 */
class OCRService {
  // Patrones regex para identificar diferentes tipos de datos
  private readonly patterns = {
    // Patrones para montos (Soles peruanos)
    amount: [
      /S\/\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:total|subtotal|importe|monto)[:\s]*S\/?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*(?:soles|S\/)/gi,
      /(\d+\.\d{2})\s*(?:total|importe)/gi,
    ],
    
    // Patrones para fechas
    date: [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      /(\d{4}-\d{1,2}-\d{1,2})/g,
      /(?:fecha|date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/gi,
    ],
    
    // Patrones para nombres de comercio
    merchant: [
      /^([A-Z\s]{3,}(?:S\.A\.C?|S\.R\.L?|E\.I\.R\.L?)?)/m,
      /(?:empresa|negocio|tienda)[:\s]*([A-Z][A-Za-z\s]+)/gi,
      /RUC[:\s]*\d{11}[^\r\n]*([A-Z][A-Za-z\s]{3,})/gi,
    ],
    
    // Patones RUC para validar comercios
    ruc: /RUC[:\s]*(\d{11})/gi,
  };

  // Mapeo de palabras clave a categorías
  private readonly categoryKeywords = {
    'Comida': ['restaurant', 'comida', 'food', 'burger', 'pizza', 'pollo', 'menu', 'almuerzo', 'cena', 'desayuno', 'cafe', 'bar'],
    'Transporte': ['taxi', 'uber', 'bus', 'combustible', 'gasolina', 'grifo', 'peaje', 'estacionamiento'],
    'Super': ['supermercado', 'market', 'plaza vea', 'wong', 'tottus', 'metro', 'vivanda', 'abarrotes'],
    'Salud': ['farmacia', 'clinica', 'hospital', 'medico', 'medicamento', 'botica', 'inkafarma', 'mifarma'],
    'Hogar': ['ferreteria', 'sodimac', 'maestro', 'promart', 'decoracion', 'muebles', 'casa'],
    'Teléfono': ['claro', 'movistar', 'entel', 'bitel', 'telefono', 'celular', 'internet', 'recarga'],
    'Alquiler': ['alquiler', 'renta', 'rent', 'inmobiliaria', 'vivienda', 'departamento'],
    'Otros': ['tienda', 'compra', 'venta', 'servicio', 'pago'],
  };

  /**
   * Procesa una imagen y extrae datos del comprobante
   */
  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // Verificar que la URI de la imagen sea válida
      if (!imageUri || typeof imageUri !== 'string') {
        return {
          success: false,
          error: 'URI de imagen inválida',
          processingTime: Date.now() - startTime,
        };
      }

      // En un entorno real, aquí usarías un servicio OCR como Google Vision API
      // Por ahora, simulamos el procesamiento OCR
      const mockText = await this.simulateOCR(imageUri);
      
      if (!mockText) {
        return {
          success: false,
          error: 'No se pudo extraer texto de la imagen',
          processingTime: Date.now() - startTime,
        };
      }

      // Procesar el texto extraído
      const extractedData = this.parseReceiptText(mockText);
      
      const endTime = Date.now();
      
      return {
        success: true,
        data: extractedData,
        rawText: mockText,
        processingTime: endTime - startTime,
      };
    } catch (error) {
      console.error('Error procesando comprobante:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Simula el procesamiento OCR de una imagen
   * En producción, esto sería reemplazado por un servicio OCR real
   */
  private async simulateOCR(imageUri: string): Promise<string> {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Texto de ejemplo que simula el OCR de un comprobante
    const mockTexts = [
      `RESTAURANTE EL BUEN SABOR S.A.C
RUC: 20123456789
Jr. Lima 123 - Lima
Fecha: ${new Date().toLocaleDateString('es-PE')}
Hora: 14:30

CONSUMO EN SALON
1 Pollo a la brasa      S/ 25.00
2 Gaseosas             S/ 8.00
1 Papas fritas         S/ 12.00

SUBTOTAL              S/ 45.00
IGV (18%)             S/ 8.10
TOTAL                 S/ 53.10

Gracias por su visita`,

      `SUPERMERCADO PLAZA VEA
RUC: 20100070970
Av. Javier Prado 123
${new Date().toLocaleDateString('es-PE')} 16:45

LECHE GLORIA 1L        S/ 4.50
PAN BIMBO GRANDE       S/ 6.20
ARROZ PAISANA 5KG      S/ 18.90
ACEITE PRIMOR 1L       S/ 8.40

SUBTOTAL              S/ 38.00
TOTAL                 S/ 38.00

EFECTIVO              S/ 38.00
VUELTO                S/ 0.00`,

      `GRIFO PETROPERU
RUC: 20131312955
Av. Venezuela 456 - Lima
Fecha: ${new Date().toLocaleDateString('es-PE')}

GASOHOL 84 PLUS
Cantidad: 10.50 Gal
Precio: S/ 14.20/Gal
IMPORTE              S/ 149.10

TOTAL                S/ 149.10
PAGO CON TARJETA     S/ 149.10

Gracias por preferirnos`
    ];
    
    // Seleccionar un texto aleatorio
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }

  /**
   * Analiza el texto extraído y extrae datos estructurados
   */
  private parseReceiptText(text: string): ExtractedReceiptData {
    const result: ExtractedReceiptData = {
      confidence: 0,
    };

    // Extraer monto
    const amount = this.extractAmount(text);
    if (amount) {
      result.amount = amount;
      result.confidence += 30;
    }

    // Extraer nombre del comercio
    const merchant = this.extractMerchant(text);
    if (merchant) {
      result.merchantName = merchant;
      result.description = `Compra en ${merchant}`;
      result.confidence += 25;
    }

    // Extraer fecha
    const date = this.extractDate(text);
    if (date) {
      result.date = date;
      result.confidence += 20;
    }

    // Determinar categoría basada en el contenido
    const category = this.determineCategory(text);
    if (category) {
      result.category = category;
      result.confidence += 25;
    }

    // Si no hay descripción, crear una genérica
    if (!result.description && result.merchantName) {
      result.description = `Gasto en ${result.merchantName}`;
    } else if (!result.description) {
      result.description = 'Gasto escaneado desde comprobante';
    }

    return result;
  }

  /**
   * Extrae el monto del texto
   */
  private extractAmount(text: string): number | undefined {
    for (const pattern of this.patterns.amount) {
      const matches = Array.from(text.matchAll(pattern));
      
      if (matches.length > 0) {
        // Buscar el monto más grande (probablemente el total)
        let maxAmount = 0;
        
        for (const match of matches) {
          const amountStr = match[1].replace(/,/g, '');
          const amount = parseFloat(amountStr);
          
          if (!isNaN(amount) && amount > maxAmount) {
            maxAmount = amount;
          }
        }
        
        if (maxAmount > 0) {
          return maxAmount;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extrae el nombre del comercio
   */
  private extractMerchant(text: string): string | undefined {
    for (const pattern of this.patterns.merchant) {
      const match = text.match(pattern);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Buscar en las primeras líneas
    const lines = text.split('\n').slice(0, 3);
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Si la línea tiene más de 5 caracteres y parece un nombre comercial
      if (cleanLine.length > 5 && /^[A-Z\s]+/.test(cleanLine)) {
        return cleanLine;
      }
    }
    
    return undefined;
  }

  /**
   * Extrae la fecha del comprobante
   */
  private extractDate(text: string): string | undefined {
    for (const pattern of this.patterns.date) {
      const match = text.match(pattern);
      
      if (match && match[1]) {
        try {
          // Normalizar formato de fecha
          const dateStr = match[1];
          const date = new Date(dateStr.replace(/\//g, '-'));
          
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (error) {
          console.warn('Error parseando fecha:', error);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Determina la categoría basada en palabras clave
   */
  private determineCategory(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return 'Otros';
  }
}

// Exportar instancia singleton
export const ocrService = new OCRService();