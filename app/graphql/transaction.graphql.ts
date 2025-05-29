import { gql } from "@apollo/client";

export const GET_TRANSACTIONS = gql`
  query Transactions {
    transactions {
      id
      userId
      title
      description
      amount
      type
      frequent
      category
      dueDate
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionDto!) {
    createTransaction(input: $input) {
      id
      title
      description
      amount
      type
      frequent
      category
      userId
      paymentmethod
      dueDate
    }
  }
`;

export const GET_TRANSACTIONS_BY_USER = gql`
  query GetTransactions {
    getTransactions {
      amount
      category
      createdAt
      description
      id
      title
      type
      updatedAt
      userId
      status
    }
  }
`;

// Consulta GraphQL para obtener los pagos pendientes
export const GET_PENDING_TRANSACTIONS = gql`
  query GetPendingTransactions {
    getTransactions(status: "pending", type: "gasto") {
      id
      title
      description
      amount
      type
      category
      status
      dueDate
      createdAt
    }
  }
`;

// Consulta GraphQL para obtener transacciones frecuentes
export const GET_FREQUENT_TRANSACTIONS = gql`
  query FrequentTransactions($type: String!, $frequent: Boolean!) {
    frequentTransactions(type: $type, frequent: $frequent) {
      id
      title
      description
      amount
      type
      frequent
      category
      status
      dueDate
      createdAt
    }
  }
`;

// Consulta para obtener transacciones por tipo
export const GET_TRANSACTIONS_BY_TYPE = gql`
  query TransactionsByType($type: String!) {
    getTransactionsByType(type: $type) {
      id
      title
      description
      amount
      type
      frequent
      category
      status
      dueDate
      createdAt
    }
  }
`;

// Mutation para actualizar el estado de una transacción
export const UPDATE_TRANSACTION_STATUS = gql`
  mutation UpdateTransactionStatus($id: Float!, $status: String!) {
    updateTransactionStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;