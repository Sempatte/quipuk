// app/graphql/users.graphql.ts
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
      profilePictureUrl
      profilePictureKey
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    getUserProfile {
      createdAt
      email
      fullName
      id
      phoneNumber
      updatedAt
      username
      profilePictureUrl
      profilePictureKey
    }
  }
`;

// Nueva mutación para eliminar foto de perfil
export const DELETE_PROFILE_PICTURE = gql`
  mutation DeleteProfilePicture {
    deleteProfilePicture
  }
`;