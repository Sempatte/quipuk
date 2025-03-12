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
