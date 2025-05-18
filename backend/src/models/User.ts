export interface User {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password?: string;
  password_hash?: string;
  firebase_uid?: string;
  role: string;
  phone?: string;
  bio?: string;
  address?: {
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  email_verified?: boolean;
  avatar?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserRegistrationInput {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  firebase_uid?: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
  firebase_uid?: string;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  address?: {
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  avatar?: string;
} 