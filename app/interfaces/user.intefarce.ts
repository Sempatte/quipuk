export interface User {
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string; // Opcional
    username: string;
    password: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Si necesitas otras interfaces relacionadas, como variables para consultas:
  export interface GetUsersData {
    users: User[];
  }
  
  export interface GetUsersVariables {
    limit?: number;
    offset?: number;
  }
  