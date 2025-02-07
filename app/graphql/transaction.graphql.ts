import { gql } from "@apollo/client";

export const GET_TRANSACTIONS = gql`
  query GetTransactions($user_id: Int, $type: String) {
    transactions(where: { user_id: { _eq: $user_id }, type: { _eq: $type } }) {
      id
      user_id
      title
      description
      amount
      type
      created_at
      category
    }
  }
`;
