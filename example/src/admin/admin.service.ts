import { Injectable } from '@nestjs/common';
import { AdminResult } from './admin.types';
import { User } from '../user/user.types';

@Injectable()
export class AdminService {
  private users: User[] = [
    { id: '1', email: 'john@example.com', name: 'John Doe', bio: 'Software developer' },
    { id: '2', email: 'jane@example.com', name: 'Jane Smith', bio: 'Product manager' },
  ];

  async deleteUser(id: string, contextUser?: any): Promise<AdminResult> {
    // Check if context user has admin role (in a real app)
    const isAdmin = contextUser?.role === 'admin';
    
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return {
        success: false,
        message: `User with id ${id} not found`,
      };
    }

    this.users.splice(userIndex, 1);
    return {
      success: true,
      message: `User with id ${id} deleted successfully by ${contextUser?.email || 'unknown'}`,
      data: id,
    };
  }

  async getAllUsers(contextUser?: any): Promise<User[]> {
    // Could filter users based on admin context/permissions
    // For now, return all users for admin users
    return this.users;
  }
}