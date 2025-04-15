import axios from 'axios';

// URL base del API - considera moverla a un archivo de configuración
const API_URL = 'http://192.168.1.12:3000';

// Interfaz para la respuesta del health check (ajustada a la estructura real)
interface HealthCheckResponse {
  success: boolean;
  data: {
    status: string;
    info: {
      database: {
        status: string;
      };
    };
    error: Record<string, unknown>;
    details: {
      database: {
        status: string;
      };
    };
  };
}

/**
 * Verifica el estado del backend
 * @returns Promise<boolean> - true si el backend está activo, false en caso contrario
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get<HealthCheckResponse>(`${API_URL}/health`, {
      timeout: 5000 // 5 segundos de timeout
    });

    console.log('Health Check Response:', response.data.data);
    
    // Verificación exacta según la estructura de respuesta esperada
    return response.data?.success === true && 
           response.data?.data?.status === "ok" &&
           response.data?.data?.info?.database?.status === "up";
  } catch (error) {
    return false;
  }
};