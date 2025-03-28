// transaction.interface.ts
export type TransactionType = "gasto" | "ingreso";

export type TransactionOption = "Gastos" | "Ingresos" | "Ahorros";

export const TRANSACTION_MAPPING: Record<TransactionOption, TransactionType> = {
  "Gastos": "gasto",
  "Ingresos": "ingreso",
  "Ahorros": "ingreso" // Considerar lógica específica si es necesario
};

export const TRANSACTION_COLORS: Record<TransactionOption, string> = {
  "Gastos": "#EF674A",
  "Ingresos": "#65CE13", 
  "Ahorros": "#00C1D5"
};

export interface Transaction {
    id: number;
    user_id: number;
    title: string;
    description: string;
    amount: number;
    type: TransactionType;
    frequent: boolean;
    status?: string;
    paymentMethod?: string;
    category: string;
    dueDate: Date;
    createdAt: string;
}

export interface GetTransactionsData {
    transactions: Transaction[];
}

export interface GetTransactionsVariables {
    user_id?: number;
    type?: TransactionType;
    category?: string;
}

// Input para crear transacción
export interface CreateTransactionInput {
    userId: number;
    title: string;
    description: string;
    amount: number;
    type: TransactionType;
    frequent: boolean;
    status: string;
    category: string;
    dueDate: Date;
}