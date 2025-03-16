import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        username
        email
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      createdAt
      email
      fullName
      phoneNumber
      updatedAt
      username
    }
  }
`;

// 📌 Definir interfaces para el login
export interface LoginResponse {
  login: {
    access_token: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
  };
}

export interface LoginVariables {
  username: string;
  password: string;
}
