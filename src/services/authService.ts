import { authRepository } from "@/repositories/authRepository";

// Auth service is where login policy and provider choices are coordinated.
export const authService = {
  loginWithEmail: authRepository.signInWithEmail,
  loginWithGoogle: authRepository.signInWithGoogle,
  logout: authRepository.signOut,
};
