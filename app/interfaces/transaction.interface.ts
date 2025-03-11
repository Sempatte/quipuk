export type TransactionType = "gasto" | "ingreso";

export interface Transaction {
    id: number;
    user_id: number;
    title: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string; // Nueva columna añadida
    createdAt: string;
}

// ✅ Interfaz para los datos devueltos en la consulta
export interface GetTransactionsData {
    transactions: Transaction[];
}

// ✅ Interfaz para los filtros de consulta
export interface GetTransactionsVariables {
    user_id?: number; // Filtrar por ID del usuario (opcional)
    type?: TransactionType; // Filtrar por tipo de transacción (opcional)
    category?: string; // Filtrar por categoría (opcional)
}
