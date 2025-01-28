export interface User {
    id: number;
    full_name: string;
    email: string;
    phone_number?: string; // Opcional
    username: string;
    password: string;
    created_at: string;
    updated_at: string;
  }
  
  // Si necesitas otras interfaces relacionadas, como variables para consultas:
  export interface GetUsersData {
    users: User[];
  }
  
  export interface GetUsersVariables {
    limit?: number;
    offset?: number;
  }
  