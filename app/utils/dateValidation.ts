// app/utils/dateValidation.ts
/**
 * Utilidades para validación y parsing de fechas en comprobantes peruanos
 */

export interface ParsedDateResult {
  date: Date;
  confidence: number;
  format: string;
  hasTime: boolean;
}

export class DateParsingUtils {
  /**
   * Valida si una fecha está en un rango razonable para comprobantes
   */
  static isReasonableReceiptDate(date: Date): boolean {
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, 0, 1);
    const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    return date >= twoYearsAgo && date <= oneMonthFromNow;
  }

  /**
   * Intenta parsear una fecha en formato peruano DD/MM/YYYY
   */
  static parsePeruvianDate(dateStr: string, timeStr?: string): ParsedDateResult | null {
    try {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      
      const [dayStr, monthStr, yearStr] = parts;
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      
      // Validaciones básicas
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      if (year < 2020 || year > 2030) return null;
      
      const date = new Date(year, month - 1, day);
      
      // Verificar que la fecha es válida (no como 31/02/2025)
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return null;
      }
      
      let confidence = 85;
      let hasTime = false;
      
      // Aplicar hora si está disponible
      if (timeStr) {
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          
          if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            date.setHours(hours, minutes, 0, 0);
            confidence += 10;
            hasTime = true;
          }
        }
      } else {
        // Si no hay hora, establecer a mediodía para evitar problemas de zona horaria
        date.setHours(12, 0, 0, 0);
      }
      
      // Verificar que la fecha sea razonable
      if (!this.isReasonableReceiptDate(date)) {
        return null;
      }
      
      return {
        date,
        confidence,
        format: 'DD/MM/YYYY',
        hasTime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Intenta parsear una fecha en formato ISO YYYY-MM-DD
   */
  static parseISODate(dateStr: string): ParsedDateResult | null {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return null;
      
      const [yearStr, monthStr, dayStr] = parts;
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      if (year < 2020 || year > 2030) return null;
      
      const date = new Date(year, month - 1, day, 12, 0, 0, 0);
      
      if (!this.isReasonableReceiptDate(date)) {
        return null;
      }
      
      return {
        date,
        confidence: 80,
        format: 'YYYY-MM-DD',
        hasTime: false
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrae y parsea todas las fechas posibles de un texto
   */
  static extractAllDates(text: string): ParsedDateResult[] {
    const results: ParsedDateResult[] = [];
    
    // Patrón para DD/MM/YYYY con posible hora
    const peruPattern = /(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2}:\d{2}))?/g;
    let match;
    
    while ((match = peruPattern.exec(text)) !== null) {
      const result = this.parsePeruvianDate(match[1], match[2]);
      if (result) {
        results.push(result);
      }
    }
    
    // Patrón para YYYY-MM-DD
    const isoPattern = /(\d{4}-\d{1,2}-\d{1,2})/g;
    while ((match = isoPattern.exec(text)) !== null) {
      const result = this.parseISODate(match[1]);
      if (result) {
        results.push(result);
      }
    }
    
    // Ordenar por confianza (mayor a menor)
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Obtiene la mejor fecha de un texto
   */
  static getBestDate(text: string): string | null {
    const dates = this.extractAllDates(text);
    
    if (dates.length === 0) {
      return null;
    }
    
    const bestDate = dates[0];
    
    
    return bestDate.date.toISOString();
  }
}