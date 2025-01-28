export interface Transaction {
    id: number;
    user_id: number;
    title: string;
    description: string;
    amount: number;
    type: "gasto" | "ingreso";
    created_at: string;
  }
  
  // Si necesitas interfaces para las consultas y variables
  export interface GetTransactionsData {
    transactions: Transaction[];
  }
  
  export interface GetTransactionsVariables {
    user_id?: number; // Filtrar por ID del usuario (opcional)
    type?: "gasto" | "ingreso"; // Filtrar por tipo de transacción
  }
  