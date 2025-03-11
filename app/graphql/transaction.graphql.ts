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
      category
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
      category
      userId
    }
  }
`;