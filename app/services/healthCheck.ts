// app/services/healthCheck.ts
import axios from 'axios';
import env from '@/app/config/env';

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
 * Verifica el estado del backend con retry y timeout optimizados
 */
export const checkBackendHealth = async (retries = 2): Promise<boolean> => {
  try {
    // Se ha aumentado el timeout para entornos de producción
    const timeout = env.isProduction ? 8000 : 10000;
    
    const response = await axios.get<HealthCheckResponse>(`${env.API_URL}/health`, {
      timeout,
      // Headers básicos
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    // Logging solo en desarrollo
    if (env.isDevelopment) {
      
    }
    
    return (
      response.data?.success === true && 
      response.data?.data?.status === "ok" &&
      response.data?.data?.info?.database?.status === "up"
    );
  } catch (error) {
    // Intenta nuevamente si hay retries disponibles
    if (retries > 0) {
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
      return checkBackendHealth(retries - 1);
    }
    
    console.error('❌ Health check failed:', error);
    return false;
  }
};