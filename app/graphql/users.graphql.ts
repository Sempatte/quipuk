import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      id
      full_name
      email
      phone_number
      username
      created_at
      updated_at
    }
  }
`;
