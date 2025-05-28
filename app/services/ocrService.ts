import * as ImagePicker from "expo-image-picker";

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
  // Patrones regex mejorados para identificar diferentes tipos de datos
  private readonly patterns = {
    // Patrones para montos (Soles peruanos)
    amount: [
      /S\/\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:total|subtotal|importe|monto)[:\s]*S\/?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*(?:soles|S\/)/gi,
      /(\d+\.\d{2})\s*(?:total|importe)/gi,
    ],

    // 🚀 PATRONES DE FECHA MEJORADOS PARA SIMULADOR
    date: [
      // Formato específico peruano DD/MM/YYYY HH:MM
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/g,
      // Formato DD/MM/YYYY
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      // Formato con texto "Fecha:" seguido de fecha
      /(?:fecha|date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2}:\d{2}))?/gi,
      // Formato DD-MM-YYYY
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      // Formato YYYY-MM-DD
      /(\d{4}-\d{1,2}-\d{1,2})/g,
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
    Comida: [
      "restaurant",
      "comida",
      "food",
      "burger",
      "pizza",
      "pollo",
      "menu",
      "almuerzo",
      "cena",
      "desayuno",
      "cafe",
      "bar",
    ],
    Transporte: [
      "taxi",
      "uber",
      "bus",
      "combustible",
      "gasolina",
      "grifo",
      "peaje",
      "estacionamiento",
    ],
    Super: [
      "supermercado",
      "market",
      "plaza vea",
      "wong",
      "tottus",
      "metro",
      "vivanda",
      "abarrotes",
      "oxxo",
      "tambo",
    ],
    Salud: [
      "farmacia",
      "clinica",
      "hospital",
      "medico",
      "medicamento",
      "botica",
      "inkafarma",
      "mifarma",
    ],
    Hogar: [
      "ferreteria",
      "sodimac",
      "maestro",
      "promart",
      "decoracion",
      "muebles",
      "casa",
    ],
    Teléfono: [
      "claro",
      "movistar",
      "entel",
      "bitel",
      "telefono",
      "celular",
      "internet",
      "recarga",
    ],
    Alquiler: [
      "alquiler",
      "renta",
      "rent",
      "inmobiliaria",
      "vivienda",
      "departamento",
    ],
    Otros: ["tienda", "compra", "venta", "servicio", "pago"],
  };

  /**
   * Procesa una imagen y extrae datos del comprobante
   */
  public async processReceiptImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // Verificar que la URI de la imagen sea válida
      if (!imageUri || typeof imageUri !== "string") {
        return {
          success: false,
          error: "URI de imagen inválida",
          processingTime: Date.now() - startTime,
        };
      }

      // En un entorno real, aquí usarías un servicio OCR como Google Vision API
      // Por ahora, simulamos el procesamiento OCR
      const mockText = await this.simulateOCR(imageUri);

      if (!mockText) {
        return {
          success: false,
          error: "No se pudo extraer texto de la imagen",
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
      console.error("Error procesando comprobante:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
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
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generar fecha realista (últimos 30 días)
    const now = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const receiptDate = new Date(
      now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000
    );
    const dateStr = receiptDate.toLocaleDateString("es-PE");
    const timeStr = `${receiptDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${receiptDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Texto de ejemplo que simula el OCR de un comprobante con fecha realista
    const mockTexts = [
      `CADENA DE COMERCIO PERU S.A.C - OXXO
RUC: 20602743960
JR. EL POLO 401 PISO 8 SANTIAGO DE SURCO
LIMA
SOGAR 101 H.
Calle Bolivar N° 270
LIMA
MIRAFLORES

OXXO

BOLETA DE VENTA ELECTRONICA
B120-0032374
Fecha: ${dateStr} ${timeStr}                    Caja: 2
Cajero/a: Daleska Janíreth Castañeda G        FV: 347530

CLAVE       CANT. P.UNITARIO   DESCTO.    TOTAL
DESCRIPCION

78023994                1.00      1.50      0.50      1.00
BON O BON LECHE 156
78680500456             1.00      5.90      0.00      5.90
CUCHAREABLE BROWNIE

OP. GRAVADAS                                      5.85
OP. EXONERADAS                                    0.00
OP. INAFECTAS                                     0.00
IGV 18%                                           1.05
TOTAL A PAGAR                               S/ 6.90

MEDIO DE PAGO:
TARJETA CREDITO                           S/ 6.90
REDONDEO                                  S/ 0.00
VUELTO                                    S/ 0.00`,

      `SUPERMERCADO PLAZA VEA
RUC: 20100070970
Av. Javier Prado 123
Fecha: ${dateStr} ${timeStr}

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
Fecha: ${dateStr} ${timeStr}

GASOHOL 84 PLUS
Cantidad: 10.50 Gal
Precio: S/ 14.20/Gal
IMPORTE              S/ 149.10

TOTAL                S/ 149.10
PAGO CON TARJETA     S/ 149.10

Gracias por preferirnos`,

      `BOTICAS & SALUD S.A.C
RUC: 20123456789
Jr. Libertad 250 - Miraflores
Fecha: ${dateStr} ${timeStr}

PARACETAMOL 500MG      S/ 12.50
VITAMINA C 1000MG      S/ 18.90
ALCOHOL GEL 500ML      S/ 8.60

SUBTOTAL              S/ 40.00
TOTAL                 S/ 40.00
EFECTIVO              S/ 40.00`,
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

    // 🚀 EXTRAER FECHA CON ALGORITMO MEJORADO
    const date = this.extractDateImproved(text);
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
      result.description = "Gasto escaneado desde comprobante";
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
          const amountStr = match[1].replace(/,/g, "");
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
    const lines = text.split("\n").slice(0, 3);
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
   * 🚀 EXTRAE LA FECHA CON ALGORITMO MEJORADO
   */
  private extractDateImproved(text: string): string | undefined {
    console.log("🔍 [OCRService] Buscando fecha en texto simulado...");

    // Buscar todas las posibles fechas en el texto
    const foundDates: { date: Date; confidence: number; source: string }[] = [];

    for (const pattern of this.patterns.date) {
      const matches = Array.from(text.matchAll(pattern));
      console.log(
        `🔍 [OCRService] Patrón encontró ${matches.length} coincidencias`
      );

      for (const match of matches) {
        console.log(`🔍 [OCRService] Analizando: "${match[0]}"`);

        try {
          let dateStr = "";
          let timeStr = "";

          // Verificar si tenemos fecha y hora separadas
          if (match[1] && match[2]) {
            dateStr = match[1];
            timeStr = match[2];
          } else if (match[1]) {
            dateStr = match[1];
          } else {
            dateStr = match[0];
          }

          // Parsear fecha según el formato
          let parsedDate: Date | null = null;
          let confidence = 0;

          if (dateStr.includes("/")) {
            // Formato DD/MM/YYYY
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              const [day, month, year] = parts.map((p) => parseInt(p, 10));

              // Validar año
              if (
                year >= 2020 &&
                year <= 2030 &&
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
              ) {
                parsedDate = new Date(year, month - 1, day);
                confidence = 90;
                console.log(
                  `✅ [OCRService] Fecha DD/MM/YYYY parseada: ${day}/${month}/${year}`
                );

                // Aplicar hora si está disponible
                if (timeStr) {
                  const timeParts = timeStr.split(":");
                  if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0], 10);
                    const minutes = parseInt(timeParts[1], 10);
                    if (
                      hours >= 0 &&
                      hours <= 23 &&
                      minutes >= 0 &&
                      minutes <= 59
                    ) {
                      parsedDate.setHours(hours, minutes, 0, 0);
                      confidence += 10;
                      console.log(
                        `✅ [OCRService] Hora aplicada: ${hours}:${minutes}`
                      );
                    }
                  }
                }
              }
            }
          } else if (dateStr.includes("-")) {
            // Formato YYYY-MM-DD o DD-MM-YYYY
            const parts = dateStr.split("-");
            if (parts.length === 3) {
              const [part1, part2, part3] = parts.map((p) => parseInt(p, 10));

              if (part1 > 2000) {
                // Formato YYYY-MM-DD
                parsedDate = new Date(part1, part2 - 1, part3);
                confidence = 85;
              } else if (part3 > 2000) {
                // Formato DD-MM-YYYY
                parsedDate = new Date(part3, part2 - 1, part1);
                confidence = 85;
              }
            }
          }

          // Validar fecha parseada
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            // Verificar que la fecha sea razonable
            const now = new Date();
            const oneYearAgo = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate()
            );
            const oneYearFromNow = new Date(
              now.getFullYear() + 1,
              now.getMonth(),
              now.getDate()
            );

            if (parsedDate >= oneYearAgo && parsedDate <= oneYearFromNow) {
              foundDates.push({
                date: parsedDate,
                confidence,
                source: match[0],
              });
              console.log(
                `✅ [OCRService] Fecha válida: ${parsedDate.toLocaleDateString(
                  "es-PE"
                )} (confianza: ${confidence})`
              );
            }
          }
        } catch (error) {
          console.log("⚠️ [OCRService] Error parseando fecha:", error);
        }
      }
    }

    // Seleccionar la mejor fecha
    if (foundDates.length > 0) {
      foundDates.sort((a, b) => b.confidence - a.confidence);
      const bestDate = foundDates[0];

      const isoDate = bestDate.date.toISOString();
      console.log(
        `✅ [OCRService] Mejor fecha seleccionada: ${bestDate.date.toLocaleDateString(
          "es-PE"
        )} -> ${isoDate}`
      );
      return isoDate;
    }

    console.log("❌ [OCRService] No se encontraron fechas válidas");
    return undefined;
  }

  /**
   * Extrae la fecha del comprobante (método legacy - mantenido por compatibilidad)
   */
  private extractDate(text: string): string | undefined {
    return this.extractDateImproved(text);
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

    return "Otros";
  }
}

// Exportar instancia singleton
export const ocrService = new OCRService();
