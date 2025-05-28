// app/services/googleVisionOCR.ts - PARSING DE FECHAS MEJORADO
import env from '@/app/config/env';
import { ExtractedReceiptData, OCRResult } from './ocrService';
import { DateParsingUtils } from '@/app/utils/dateValidation';

const GOOGLE_VISION_API_KEY = env.GOOGLE_VISION_API_KEY || '';
const GOOGLE_VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

class GoogleVisionOCR {
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

      // Request optimizado para comprobantes
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
              // Añadir detección de documentos para mejor OCR
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              }
            ],
            // Configuración de imagen para mejor procesamiento
            imageContext: {
              languageHints: ['es', 'en'] // Español e inglés para comprobantes peruanos
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

        // Priorizar DOCUMENT_TEXT_DETECTION si está disponible
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
            confidence: extractedData.confidence,
            hasDescription: !!extractedData.description,
            hasDate: !!extractedData.date,
            extractedDate: extractedData.date
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
   * Parser optimizado para comprobantes peruanos - CON MEJORAS EN FECHAS
   */
  private parseReceiptTextOptimized(text: string): ExtractedReceiptData {
    console.log('🔍 [GoogleVision] Iniciando parsing optimizado...');
    
    // Patrones mejorados para comprobantes peruanos
    const patterns = {
      // Patrones de monto más específicos y ordenados por prioridad
      amount: [
        // Buscar "TOTAL" primero (más confiable)
        /(?:total|subtotal|importe final|monto total)[:\s]*s\/?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
        // Buscar montos con formato peruano
        /s\/\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
        // Buscar números al final de líneas (probablemente totales)
        /(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))\s*$/gm,
        // Buscar montos cerca de palabras clave
        /(?:pagar|cobrar|debe|total)[:\s]*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
      ],
      
      // 🚀 PATRONES DE FECHA COMPLETAMENTE MEJORADOS
      date: [
        // Formato específico peruano DD/MM/YYYY HH:MM (más común en comprobantes)
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/g,
        // Formato DD/MM/YYYY sin hora
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        // Formato con texto "Fecha:" seguido de fecha
        /(?:fecha|date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2}:\d{2}))?/gi,
        // Formato DD-MM-YYYY (alternativo)
        /(\d{1,2}-\d{1,2}-\d{4})/g,
        // Formato YYYY-MM-DD (ISO)
        /(\d{4}-\d{1,2}-\d{1,2})/g,
        // Formato con palabras en español
        /(\d{1,2})\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/gi,
        // Búsqueda por contexto cerca de números que parecen fechas
        /(?:emitido|emision|compra|venta|operacion)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      ],
      
      // Patrones de comercio mejorados para Perú
      merchant: [
        // Líneas que empiezan con mayúsculas (nombres de empresa)
        /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,}(?:S\.A\.C?|S\.R\.L?|E\.I\.R\.L?|S\.A\.|LTDA\.)?)/m,
        // Después de RUC
        /RUC[:\s]*\d{11}[^\r\n]*\n([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]{3,})/gi,
        // Patrones específicos de cadenas peruanas
        /(PLAZA VEA|WONG|TOTTUS|METRO|VIVANDA|KFC|POPEYES|BEMBOS|NORKY'S|PARDOS|OXXO|TAMBO)/gi,
      ],
    };

    // Keywords expandidos para categorización peruana
    const categoryKeywords = {
      'Comida': [
        // Restaurantes y comida rápida
        'restaurant', 'comida', 'food', 'burger', 'pizza', 'pollo', 'menu', 'almuerzo', 'cena', 'desayuno',
        'cafe', 'bar', 'polleria', 'sangucheria', 'chifa', 'cevicheria', 'parrilla', 'anticucheria',
        // Cadenas peruanas conocidas
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

    // 1. Extraer monto con algoritmo mejorado
    console.log('🔍 [GoogleVision] Buscando montos...');
    const amounts: number[] = [];
    
    for (const pattern of patterns.amount) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        let amountStr = match[1];
        // Normalizar formato peruano (coma como separador de miles, punto como decimal)
        amountStr = amountStr.replace(/,(\d{3})/g, '$1'); // Remover comas de miles
        amountStr = amountStr.replace(',', '.'); // Convertir coma decimal a punto
        
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0 && amount < 100000) { // Filtro realista
          amounts.push(amount);
        }
      }
    }
    
    if (amounts.length > 0) {
      // Tomar el monto más grande (probablemente el total)
      result.amount = Math.max(...amounts);
      result.confidence += 40;
      console.log(`✅ [GoogleVision] Monto encontrado: S/ ${result.amount} (de ${amounts.length} candidatos)`);
    }

    // 2. Extraer comercio con priorización
    console.log('🔍 [GoogleVision] Buscando nombre de comercio...');
    for (const pattern of patterns.merchant) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let merchantName = match[1].trim();
        // Limpiar nombre del comercio
        merchantName = merchantName.replace(/[^\w\s\.\-áéíóúñÁÉÍÓÚÑ]/g, ' ').trim();
        
        if (merchantName.length >= 3) {
          result.merchantName = merchantName;
          result.confidence += 30;
          console.log(`✅ [GoogleVision] Comercio encontrado: ${merchantName}`);
          break;
        }
      }
    }

    // 3. 🚀 EXTRAER FECHA CON ALGORITMO COMPLETAMENTE MEJORADO
    console.log('🔍 [GoogleVision] Buscando fecha...');
    console.log('📄 [GoogleVision] Texto completo para análisis de fecha:', text);
    
    // Buscar todas las posibles fechas en el texto
    const foundDates: { date: Date; confidence: number; source: string }[] = [];
    
    for (const pattern of patterns.date) {
      const matches = Array.from(text.matchAll(pattern));
      console.log(`🔍 [GoogleVision] Patrón ${pattern.source} encontró ${matches.length} coincidencias`);
      
      for (const match of matches) {
        console.log(`🔍 [GoogleVision] Analizando coincidencia: "${match[0]}"`);
        
        try {
          let dateStr = '';
          let timeStr = '';
          
          // Verificar si tenemos fecha y hora separadas
          if (match[1] && match[2]) {
            dateStr = match[1];
            timeStr = match[2];
            console.log(`🔍 [GoogleVision] Fecha con hora detectada: ${dateStr} ${timeStr}`);
          } else if (match[1]) {
            dateStr = match[1];
            console.log(`🔍 [GoogleVision] Solo fecha detectada: ${dateStr}`);
          } else {
            dateStr = match[0];
            console.log(`🔍 [GoogleVision] Fecha completa: ${dateStr}`);
          }
          
          // Parsear fecha según el formato
          let parsedDate: Date | null = null;
          let confidence = 0;
          
          if (dateStr.includes('/')) {
            // Formato DD/MM/YYYY o MM/DD/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const [part1, part2, year] = parts.map(p => parseInt(p, 10));
              
              // Validar año
              if (year >= 2020 && year <= 2030) {
                // Asumir formato peruano DD/MM/YYYY si el primer número > 12
                if (part1 > 12) {
                  parsedDate = new Date(year, part2 - 1, part1);
                  confidence = 90; // Alta confianza para formato peruano
                  console.log(`✅ [GoogleVision] Formato DD/MM/YYYY confirmado: ${part1}/${part2}/${year}`);
                } 
                // Si ambos son <= 12, priorizar formato DD/MM/YYYY (Perú)
                else if (part2 <= 12) {
                  parsedDate = new Date(year, part2 - 1, part1);
                  confidence = 80; // Buena confianza
                  console.log(`✅ [GoogleVision] Asumiendo formato DD/MM/YYYY: ${part1}/${part2}/${year}`);
                }
                // Último recurso: MM/DD/YYYY
                else {
                  parsedDate = new Date(year, part1 - 1, part2);
                  confidence = 60; // Menor confianza
                  console.log(`⚠️ [GoogleVision] Formato MM/DD/YYYY como último recurso: ${part1}/${part2}/${year}`);
                }
                
                // Si tenemos hora, aplicarla
                if (timeStr && parsedDate) {
                  const timeParts = timeStr.split(':');
                  if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0], 10);
                    const minutes = parseInt(timeParts[1], 10);
                    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                      parsedDate.setHours(hours, minutes, 0, 0);
                      confidence += 10; // Bonus por tener hora válida
                      console.log(`✅ [GoogleVision] Hora aplicada: ${hours}:${minutes}`);
                    }
                  }
                }
              }
            }
          } else if (dateStr.includes('-')) {
            // Formato YYYY-MM-DD o DD-MM-YYYY
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              const [part1, part2, part3] = parts.map(p => parseInt(p, 10));
              
              if (part1 > 2000) {
                // Formato YYYY-MM-DD
                parsedDate = new Date(part1, part2 - 1, part3);
                confidence = 85;
                console.log(`✅ [GoogleVision] Formato YYYY-MM-DD: ${part1}-${part2}-${part3}`);
              } else if (part3 > 2000) {
                // Formato DD-MM-YYYY
                parsedDate = new Date(part3, part2 - 1, part1);
                confidence = 85;
                console.log(`✅ [GoogleVision] Formato DD-MM-YYYY: ${part1}-${part2}-${part3}`);
              }
            }
          }
          
          // Validar fecha parseada
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            // Verificar que la fecha sea razonable (no muy antigua ni muy futura)
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            
            if (parsedDate >= oneYearAgo && parsedDate <= oneYearFromNow) {
              foundDates.push({
                date: parsedDate,
                confidence,
                source: match[0]
              });
              console.log(`✅ [GoogleVision] Fecha válida encontrada: ${parsedDate.toLocaleDateString('es-PE')} (confianza: ${confidence})`);
            } else {
              console.log(`⚠️ [GoogleVision] Fecha fuera de rango válido: ${parsedDate.toLocaleDateString('es-PE')}`);
            }
          } else {
            console.log(`❌ [GoogleVision] No se pudo parsear la fecha: ${dateStr}`);
          }
        } catch (error) {
          console.log('⚠️ [GoogleVision] Error parseando fecha:', error);
        }
      }
    }
    
    // Seleccionar la mejor fecha encontrada
    if (foundDates.length > 0) {
      // Ordenar por confianza (mayor a menor)
      foundDates.sort((a, b) => b.confidence - a.confidence);
      
      const bestDate = foundDates[0];
      result.date = bestDate.date.toISOString();
      result.confidence += 25; // Bonus por tener fecha
      
      console.log(`✅ [GoogleVision] Mejor fecha seleccionada: ${bestDate.date.toLocaleDateString('es-PE')} ${bestDate.date.toLocaleTimeString('es-PE')} (confianza: ${bestDate.confidence}) desde "${bestDate.source}"`);
      console.log(`📅 [GoogleVision] Fecha ISO resultante: ${result.date}`);
    } else {
      console.log('❌ [GoogleVision] No se encontraron fechas válidas');
    }

    // 4. Determinar categoría con scoring
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
    
    // Seleccionar categoría con mayor score
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

    // 5. Generar descripción inteligente
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