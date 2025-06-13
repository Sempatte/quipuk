// app/services/googleVisionOCR.ts - CON DETECCIÓN DE MÉTODOS DE PAGO
import env from '@/app/config/env';
import { ExtractedReceiptData, OCRResult } from './ocrService';

const GOOGLE_VISION_API_KEY = env.GOOGLE_VISION_API_KEY || '';
const GOOGLE_VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

class GoogleVisionOCR {
  // 🆕 KEYWORDS PARA MÉTODOS DE PAGO
  private readonly paymentMethodKeywords = {
    "Tarjeta de Crédito": [
      "tarjeta credito", "tarjeta crédito", "credit card", "credito", "crédito",
      "visa", "mastercard", "amex", "american express", "tc", "t/c", "credit"
    ],
    "Tarjeta de Débito": [
      "tarjeta debito", "tarjeta débito", "debit card", "debito", "débito",
      "td", "t/d", "tarjeta de debito", "debit"
    ],
    "Efectivo": [
      "efectivo", "cash", "contado", "dinero efectivo", "pago efectivo"
    ],
    "Yape": [
      "yape", "app yape", "billetera yape", "pago yape"
    ],
    "Banco": [
      "transferencia", "cuenta bancaria", "banco", "transferencia bancaria",
      "pago banco", "deposito", "depósito", "transfer"
    ]
  };

  public isConfigured(): boolean {
    const isConfigured = !!GOOGLE_VISION_API_KEY && GOOGLE_VISION_API_KEY.length > 10;
    console.log(`🔍 [GoogleVision] isConfigured: ${isConfigured}, keyLength: ${GOOGLE_VISION_API_KEY?.length || 0}`);
    return isConfigured;
  }

  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    console.log('🔍 [GoogleVision] Iniciando procesamiento de imagen:', imageUri.substring(0, 80) + '...');
    
    if (!this.isConfigured()) {
      console.log('❌ [GoogleVision] API no configurada');
      return {
        success: false,
        error: 'Google Vision API no está configurada',
        processingTime: Date.now() - startTime,
      };
    }

    try {
      console.log('🔍 [GoogleVision] Convirtiendo imagen a base64...');
      
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
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              }
            ],
            imageContext: {
              languageHints: ['es', 'en']
            }
          },
        ],
      };

      console.log('🔍 [GoogleVision] Enviando request a Google Vision API...');

      const response = await fetch(GOOGLE_VISION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'QuipukApp/1.0'
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`🔍 [GoogleVision] Respuesta recibida: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [GoogleVision] Error en API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 300)
        });

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

      const result = await response.json();
      const endTime = Date.now();

      console.log('🔍 [GoogleVision] Respuesta parseada exitosamente');

      if (result.error) {
        console.error('❌ [GoogleVision] Error en respuesta de API:', result.error);
        return {
          success: false,
          error: `Google Vision Error: ${result.error.message || 'Error desconocido'}`,
          processingTime: endTime - startTime,
        };
      }

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

        let detectedText = '';
        
        if (apiResponse.fullTextAnnotation && apiResponse.fullTextAnnotation.text) {
          detectedText = apiResponse.fullTextAnnotation.text;
          console.log('✅ [GoogleVision] Usando DOCUMENT_TEXT_DETECTION (mejor calidad)');
        } else if (apiResponse.textAnnotations && apiResponse.textAnnotations[0]) {
          detectedText = apiResponse.textAnnotations[0].description;
          console.log('✅ [GoogleVision] Usando TEXT_DETECTION (estándar)');
        }
        
        console.log(`📄 [GoogleVision] Longitud del texto: ${detectedText?.length || 0} caracteres`);
        console.log(`📄 [GoogleVision] Primeros 200 caracteres:`, detectedText?.substring(0, 200) + '...');
        
        if (detectedText && detectedText.trim().length > 0) {
          console.log('🔍 [GoogleVision] Iniciando parsing optimizado...');
          const extractedData = this.parseReceiptTextOptimized(detectedText);
          
          console.log('✅ [GoogleVision] Datos extraídos:', {
            amount: extractedData.amount,
            merchantName: extractedData.merchantName,
            category: extractedData.category,
            paymentMethod: extractedData.paymentmethod, // 🆕 NUEVO LOG
            confidence: extractedData.confidence,
            hasDescription: !!extractedData.description,
            hasDate: !!extractedData.date,
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
   * Parser optimizado para comprobantes peruanos con detección de métodos de pago
   */
  private parseReceiptTextOptimized(text: string): ExtractedReceiptData {
    console.log('🔍 [GoogleVision] Iniciando parsing optimizado...');
    
    const patterns = {
      amount: [
        /(?:total|subtotal|importe final|monto total)[:\s]*s\/?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
        /s\/\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
        /(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))\s*$/gm,
        /(?:pagar|cobrar|debe|total)[:\s]*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
      ],
      
      date: [
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/g,
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        /(?:fecha|date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2}:\d{2}))?/gi,
        /(\d{1,2}-\d{1,2}-\d{4})/g,
        /(\d{4}-\d{1,2}-\d{1,2})/g,
        /(\d{1,2})\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/gi,
        /(?:emitido|emision|compra|venta|operacion)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      ],
      
      merchant: [
        /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,}(?:S\.A\.C?|S\.R\.L?|E\.I\.R\.L?|S\.A\.|LTDA\.)?)/m,
        /RUC[:\s]*\d{11}[^\r\n]*\n([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]{3,})/gi,
        /(PLAZA VEA|WONG|TOTTUS|METRO|VIVANDA|KFC|POPEYES|BEMBOS|NORKY'S|PARDOS|OXXO|TAMBO)/gi,
      ],

      // 🆕 PATRONES PARA MÉTODOS DE PAGO
      paymentMethod: [
        /(?:medio\s+de\s+pago|metodo\s+de\s+pago|forma\s+de\s+pago)[:\s]*([^\r\n]+)/gi,
        /(?:pago\s+con|pagado\s+con)[:\s]*([^\r\n]+)/gi,
        /(?:tarjeta\s+(?:de\s+)?(?:credito|crédito|credit))/gi,
        /(?:tarjeta\s+(?:de\s+)?(?:debito|débito|debit))/gi,
        /(?:visa|mastercard|amex|american\s+express)/gi,
        /(?:efectivo|cash|contado)/gi,
        /(?:yape|plin|tunki)/gi,
        /(?:transferencia|banco|cuenta\s+bancaria)/gi,
        /(?:^|\n)([A-Z\s]+(?:CREDITO|DEBITO|EFECTIVO|YAPE|TRANSFERENCIA))\s*S\/?\s*\d/gm,
      ],
    };

    // Keywords expandidos para categorización peruana
    const categoryKeywords = {
      'Comida': [
        'restaurant', 'comida', 'food', 'burger', 'pizza', 'pollo', 'menu', 'almuerzo', 'cena', 'desayuno',
        'cafe', 'bar', 'polleria', 'sangucheria', 'chifa', 'cevicheria', 'parrilla', 'anticucheria',
        'bembos', 'norky', 'pardos', 'kfc', 'popeyes', 'papa john', 'domino', 'chin wok', 'mr. pollo',
        'la lucha', 'segundo muelle', 'madam tusan', 'tanta', 'pardo chicken', 'rokys'
      ],
      'Transporte': [
        'taxi', 'uber', 'bus', 'combustible', 'gasolina', 'grifo', 'peaje', 'estacionamiento', 'parking',
        'petroperu', 'primax', 'shell', 'repsol', 'esso', 'mobil', 'via expresa', 'metropolitano',
        'transporte publico', 'combi', 'micro'
      ],
      'Super': [
        'supermercado', 'market', 'plaza vea', 'wong', 'tottus', 'metro', 'vivanda', 'abarrotes',
        'minimarket', 'bodega', 'mass', 'makro', 'mayorista', 'retail', 'hipermercado', 'oxxo', 'tambo'
      ],
      'Salud': [
        'farmacia', 'clinica', 'hospital', 'medico', 'medicamento', 'botica', 'inkafarma', 'mifarma',
        'fasa', 'arcangel', 'boticas', 'drogueria', 'laboratorio', 'consulta', 'doctor', 'dental'
      ],
      'Hogar': [
        'ferreteria', 'sodimac', 'maestro', 'promart', 'decoracion', 'muebles', 'casa', 'hogar',
        'ace home center', 'construmart', 'cassinelli', 'pinturas', 'herramientas', 'jardin'
      ],
      'Teléfono': [
        'claro', 'movistar', 'entel', 'bitel', 'telefono', 'celular', 'internet', 'recarga',
        'plan', 'linea', 'movil', 'chip', 'saldo', 'megas', 'gigas'
      ],
      'Alquiler': [
        'alquiler', 'renta', 'rent', 'inmobiliaria', 'vivienda', 'departamento', 'casa',
        'propiedad', 'arrendamiento', 'mensualidad'
      ],
      'Deducibles': [
        'servicios profesionales', 'honorarios', 'consultoria', 'asesoria', 'capacitacion',
        'educacion', 'universidad', 'instituto', 'colegio', 'academia'
      ]
    };

    const result: ExtractedReceiptData = {
      confidence: 0,
    };

    // 1. Extraer monto
    console.log('🔍 [GoogleVision] Buscando montos...');
    const amounts: number[] = [];
    
    for (const pattern of patterns.amount) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        let amountStr = match[1];
        amountStr = amountStr.replace(/,(\d{3})/g, '$1');
        amountStr = amountStr.replace(',', '.');
        
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0 && amount < 100000) {
          amounts.push(amount);
        }
      }
    }
    
    if (amounts.length > 0) {
      result.amount = Math.max(...amounts);
      result.confidence += 40;
      console.log(`✅ [GoogleVision] Monto encontrado: S/ ${result.amount} (de ${amounts.length} candidatos)`);
    }

    // 2. Extraer comercio
    console.log('🔍 [GoogleVision] Buscando nombre de comercio...');
    for (const pattern of patterns.merchant) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let merchantName = match[1].trim();
        merchantName = merchantName.replace(/[^\w\s\.\-áéíóúñÁÉÍÓÚÑ]/g, ' ').trim();
        
        if (merchantName.length >= 3) {
          result.merchantName = merchantName;
          result.confidence += 30;
          console.log(`✅ [GoogleVision] Comercio encontrado: ${merchantName}`);
          break;
        }
      }
    }

    // 3. Extraer fecha (código existente simplificado)
    console.log('🔍 [GoogleVision] Buscando fecha...');
    const foundDates: { date: Date; confidence: number; source: string }[] = [];
    
    for (const pattern of patterns.date) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        try {
          let dateStr = match[1] || match[0];
          let timeStr = match[2];
          
          let parsedDate: Date | null = null;
          let confidence = 0;
          
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const [part1, part2, year] = parts.map(p => parseInt(p, 10));
              
              if (year >= 2020 && year <= 2030) {
                if (part1 > 12) {
                  parsedDate = new Date(year, part2 - 1, part1);
                  confidence = 90;
                } else if (part2 <= 12) {
                  parsedDate = new Date(year, part2 - 1, part1);
                  confidence = 80;
                }
                
                if (timeStr && parsedDate) {
                  const timeParts = timeStr.split(':');
                  if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0], 10);
                    const minutes = parseInt(timeParts[1], 10);
                    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                      parsedDate.setHours(hours, minutes, 0, 0);
                      confidence += 10;
                    }
                  }
                }
              }
            }
          }
          
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            
            if (parsedDate >= oneYearAgo && parsedDate <= oneYearFromNow) {
              foundDates.push({
                date: parsedDate,
                confidence,
                source: match[0]
              });
            }
          }
        } catch (error) {
          console.log('⚠️ [GoogleVision] Error parseando fecha:', error);
        }
      }
    }
    
    if (foundDates.length > 0) {
      foundDates.sort((a, b) => b.confidence - a.confidence);
      const bestDate = foundDates[0];
      result.date = bestDate.date.toISOString();
      result.confidence += 25;
      
      console.log(`✅ [GoogleVision] Mejor fecha seleccionada: ${bestDate.date.toLocaleDateString('es-PE')}`);
    }

    // 4. 🆕 EXTRAER MÉTODO DE PAGO
    console.log('💳 [GoogleVision] Buscando método de pago...');
    const paymentMethod = this.extractPaymentMethodFromText(text);
    if (paymentMethod) {
      result.paymentmethod = paymentMethod;
      result.confidence += 15;
      console.log(`✅ [GoogleVision] Método de pago encontrado: ${paymentMethod}`);
    }

    // 5. Determinar categoría con scoring
    console.log('🔍 [GoogleVision] Determinando categoría...');
    const lowerText = text.toLowerCase();
    const categoryScores: {[key: string]: number} = {};
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'g');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > 0) {
        categoryScores[category] = score;
      }
    }
    
    if (Object.keys(categoryScores).length > 0) {
      const bestCategory = Object.keys(categoryScores).reduce((a, b) => 
        categoryScores[a] > categoryScores[b] ? a : b
      );
      result.category = bestCategory;
      result.confidence += 15;
      console.log(`✅ [GoogleVision] Categoría encontrada: ${bestCategory} (score: ${categoryScores[bestCategory]})`);
    } else {
      result.category = 'Otros';
      console.log('📝 [GoogleVision] Asignando categoría por defecto: Otros');
    }

    // 6. Generar descripción inteligente
    if (result.merchantName) {
      result.description = `Compra en ${result.merchantName}`;
      if (result.category && result.category !== 'Otros') {
        result.description += ` (${result.category})`;
      }
    } else {
      result.description = result.category !== 'Otros' 
        ? `Gasto de ${result.category.toLowerCase()}` 
        : 'Gasto escaneado desde comprobante';
    }

    console.log(`✅ [GoogleVision] Parsing completado - Confianza: ${result.confidence}%`);
    return result;
  }

  /**
   * 🆕 NUEVA FUNCIÓN: Extrae el método de pago del texto
   */
  private extractPaymentMethodFromText(text: string): string | undefined {
    console.log('💳 [GoogleVision] Iniciando detección de método de pago...');
    
    const lowerText = text.toLowerCase();
    const foundMethods: { method: string; confidence: number; match: string }[] = [];

    // 1. Búsqueda por keywords específicos
    for (const [method, keywords] of Object.entries(this.paymentMethodKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          // Calcular confianza basada en especificidad del keyword
          let confidence = 70;
          if (keyword.length > 10) confidence = 85; // Keywords más específicos
          if (keyword.includes('tarjeta')) confidence = 90; // Keywords de tarjeta
          if (keyword === 'yape') confidence = 95; // Yape es muy específico
          
          foundMethods.push({
            method,
            confidence,
            match: keyword
          });
          
          console.log(`💳 [GoogleVision] Keyword encontrado: "${keyword}" -> ${method} (${confidence}%)`);
        }
      }
    }

    // 2. Búsqueda por patrones contextuales
    const contextPatterns = [
      /(?:medio\s+de\s+pago|metodo\s+de\s+pago|forma\s+de\s+pago)[:\s]*([^\r\n]+)/gi,
      /(?:pago\s+con|pagado\s+con)[:\s]*([^\r\n]+)/gi,
      /(?:tipo\s+de\s+pago)[:\s]*([^\r\n]+)/gi,
    ];

    for (const pattern of contextPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const paymentInfo = match[1]?.toLowerCase().trim();
        
        if (paymentInfo) {
          console.log(`💳 [GoogleVision] Información de pago contextual: "${paymentInfo}"`);
          
          // Analizar el contexto extraído
          if (paymentInfo.includes('credito') || paymentInfo.includes('crédito') || 
              paymentInfo.includes('credit') || paymentInfo.includes('visa') || 
              paymentInfo.includes('mastercard')) {
            foundMethods.push({
              method: 'Tarjeta de Crédito',
              confidence: 85,
              match: paymentInfo
            });
          } else if (paymentInfo.includes('debito') || paymentInfo.includes('débito') || 
                     paymentInfo.includes('debit')) {
            foundMethods.push({
              method: 'Tarjeta de Débito',
              confidence: 85,
              match: paymentInfo
            });
          } else if (paymentInfo.includes('yape')) {
            foundMethods.push({
              method: 'Yape',
              confidence: 95,
              match: paymentInfo
            });
          } else if (paymentInfo.includes('efectivo') || paymentInfo.includes('cash')) {
            foundMethods.push({
              method: 'Efectivo',
              confidence: 80,
              match: paymentInfo
            });
          } else if (paymentInfo.includes('transferencia') || paymentInfo.includes('banco')) {
            foundMethods.push({
              method: 'Banco',
              confidence: 75,
              match: paymentInfo
            });
          }
        }
      }
    }

    // 3. Búsqueda por patrones de línea final (formato común en comprobantes)
    const finalLinePattern = /(?:^|\n)([A-Z\s]+(?:CREDITO|DEBITO|EFECTIVO|YAPE|TRANSFERENCIA))\s*S\/?\s*\d/gm;
    const finalLineMatches = Array.from(text.matchAll(finalLinePattern));
    
    for (const match of finalLineMatches) {
      const lineText = match[1].toLowerCase().trim();
      console.log(`💳 [GoogleVision] Línea final de pago: "${lineText}"`);
      
      if (lineText.includes('credito') || lineText.includes('crédito')) {
        foundMethods.push({
          method: 'Tarjeta de Crédito',
          confidence: 90,
          match: lineText
        });
      } else if (lineText.includes('debito') || lineText.includes('débito')) {
        foundMethods.push({
          method: 'Tarjeta de Débito',
          confidence: 90,
          match: lineText
        });
      } else if (lineText.includes('efectivo')) {
        foundMethods.push({
          method: 'Efectivo',
          confidence: 85,
          match: lineText
        });
      } else if (lineText.includes('yape')) {
        foundMethods.push({
          method: 'Yape',
          confidence: 95,
          match: lineText
        });
      } else if (lineText.includes('transferencia')) {
        foundMethods.push({
          method: 'Banco',
          confidence: 80,
          match: lineText
        });
      }
    }

    // 4. Seleccionar el mejor método encontrado
    if (foundMethods.length > 0) {
      // Eliminar duplicados y mantener el de mayor confianza
      const uniqueMethods = foundMethods.reduce((acc, current) => {
        const existing = acc.find(item => item.method === current.method);
        if (!existing || current.confidence > existing.confidence) {
          return acc.filter(item => item.method !== current.method).concat(current);
        }
        return acc;
      }, [] as typeof foundMethods);

      // Ordenar por confianza (mayor a menor)
      uniqueMethods.sort((a, b) => b.confidence - a.confidence);
      
      const bestMethod = uniqueMethods[0];
      console.log(`✅ [GoogleVision] Mejor método detectado: ${bestMethod.method} (${bestMethod.confidence}%) desde "${bestMethod.match}"`);
      
      return bestMethod.method;
    }

    console.log('❌ [GoogleVision] No se detectó método de pago específico');
    return undefined; // No forzar un método por defecto
  }

  private async convertImageToBase64(imageUri: string): Promise<string | null> {
    try {
      console.log('🔍 [GoogleVision] Descargando imagen desde URI...');
      
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        console.error('❌ [GoogleVision] Error descargando imagen:', response.status);
        return null;
      }
      
      const blob = await response.blob();
      
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
              reject(new Error('FileReader no devolvió datos válidos'));
              return;
            }
            
            const base64Parts = base64data.split(',');
            if (base64Parts.length < 2) {
              reject(new Error('Formato base64 inválido'));
              return;
            }
            
            const base64 = base64Parts[1];
            console.log(`✅ [GoogleVision] Base64 convertido exitosamente - longitud: ${base64.length}`);
            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('💥 [GoogleVision] Error convirtiendo imagen a base64:', error);
      return null;
    }
  }
}

export const googleVisionOCR = new GoogleVisionOCR();