import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query Users {
    users {
        createdAt
        email
        fullName
        id
        phoneNumber
        updatedAt
        username
    }
}
`;
