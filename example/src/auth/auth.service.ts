import { Injectable } from '@nestjs/common';
import { AuthResult, LoginInput } from './auth.types';
import { User } from '../user/user.types';

@Injectable()
export class AuthService {
  private currentUser: User = {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    bio: 'Software developer',
  };

  async login(credentials: LoginInput, contextUser?: any): Promise<AuthResult> {
    // Mock authentication using context user data
    if (credentials.email === 'john@example.com' && credentials.password === 'password') {
      // Use context user data if available, otherwise use default
      const user = contextUser && contextUser.id !== 'guest' ? {
        ...this.currentUser,
        ...contextUser,
      } : this.currentUser;
      
      return {
        token: 'mock-jwt-token',
        user,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
    }
    throw new Error('Invalid credentials');
  }

  async logout(contextUser?: any): Promise<boolean> {
    // Mock logout with context user data
    // In a real app, you might clear session data for the context user
    return true;
  }

  async getCurrentUser(contextUser?: any): Promise<User> {
    // Return context user data if available, otherwise return default
    if (contextUser && contextUser.id !== 'guest') {
      return {
        ...this.currentUser,
        ...contextUser,
      };
    }
    return this.currentUser;
  }
}