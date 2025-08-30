import { Injectable } from '@nestjs/common';
import { User, UserProfile, CreateUserInput } from './user.types';

@Injectable()
export class UserService {
  private users: User[] = [
    { id: '1', email: 'john@example.com', name: 'John Doe', bio: 'Software developer' },
    { id: '2', email: 'jane@example.com', name: 'Jane Smith', bio: 'Product manager' },
  ];

  private profiles: UserProfile[] = [
    { id: '1', userId: '1', bio: 'Software developer', avatar: 'avatar1.jpg' },
    { id: '2', userId: '2', bio: 'Product manager', avatar: 'avatar2.jpg' },
  ];

  async create(input: CreateUserInput, contextUser?: any): Promise<User> {
    // Create user with additional context from the requesting user
    const user: User = {
      id: (this.users.length + 1).toString(),
      ...input,
      // Could add createdBy field based on contextUser if needed
    };
    this.users.push(user);
    return user;
  }

  async getProfile(id: string, contextUser?: any): Promise<UserProfile> {
    const profile = this.profiles.find(p => p.userId === id);
    if (!profile) {
      throw new Error(`Profile not found for user ${id}`);
    }
    // Find the user data to include with profile
    const user = this.users.find(u => u.id === id);
    // Return profile with user data
    return {
      ...profile,
      user: user || { id, email: '', name: '', bio: '' },
    } as any;
  }

  async findAll(contextUser?: any): Promise<User[]> {
    // Could filter users based on contextUser permissions if needed
    return this.users;
  }
}