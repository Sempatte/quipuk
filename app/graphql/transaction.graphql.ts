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
