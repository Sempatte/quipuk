// Asumiendo que este archivo ya existe, aquí se muestra una ampliación
// Agregando la interfaz para las transacciones frecuentes

export type TransactionOption = "Gastos" | "Ingresos" | "Ahorros";
export type TransactionType = "gasto" | "ingreso" | "ahorro";
export type TransactionStatus = "pending" | "completed";

export const TRANSACTION_MAPPING: Record<TransactionOption, TransactionType> = {
  Gastos: "gasto",
  Ingresos: "ingreso",
  Ahorros: "ahorro",
};

export const TRANSACTION_COLORS: Record<TransactionOption, string> = {
  Gastos: "#FF5252",
  Ingresos: "#00DC5A",
  Ahorros: "#2196F3",
};

export interface Transaction {
  id: number;
  userId: number;
  title: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequent: boolean;
  category: string;
  status?: TransactionStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTransactionsData {
  transactions: Transaction[];
}

export interface GetTransactionsVariables {
  user_id?: number;
  type?: TransactionType;
}

// Interfaz para las transacciones frecuentes
export interface FrequentTransactionsData {
  frequentTransactions: Transaction[];
}

export interface FrequentTransactionsVariables {
  type: TransactionType;
  frequent: boolean;
}

export interface CreateTransactionInput {
  userId: number;
  title: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequent: boolean;
  category: string;
  status?: TransactionStatus;
  dueDate?: Date;
}

export interface CreateTransactionResponse {
  createTransaction: Transaction;
}