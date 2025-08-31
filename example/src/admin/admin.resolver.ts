import { Args, Context } from '@nestjs/graphql';
import { NamespaceResolver, NestedMutation, NestedQuery } from 'nestjs-gql-namespaces';
import { User } from '../user/user.types';
import { AdminService } from './admin.service';
import { AdminResult } from './admin.types';
import { Logger } from '@nestjs/common';

@NamespaceResolver({ fieldName: 'admin' })
export class AdminResolver {
  private readonly logger = new Logger(AdminResolver.name);

  constructor(private readonly adminService: AdminService) { }

  @NestedMutation(() => AdminResult)
  async deleteUser(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<AdminResult> {
    const mockUser = context.user;
    this.logger.log(`Admin action: Deleting user ${id}, requested by context user: ${JSON.stringify(mockUser)}`);
    
    const result = await this.adminService.deleteUser(id, mockUser);
    this.logger.log(`User ${id} deleted successfully by admin: ${mockUser.email}`);
    return result;
  }

  @NestedQuery(() => [User])
  async getAllUsers(@Context() context: any): Promise<User[]> {
    const mockUser = context.user || { id: 'admin', email: 'admin@example.com', name: 'Admin User', role: 'admin' };
    this.logger.log(`Admin query: Getting all users, requested by context user: ${JSON.stringify(mockUser)}`);
    
    const users = await this.adminService.getAllUsers(mockUser);
    this.logger.log(`Returning ${users.length} users to admin: ${mockUser.email}`);
    return users;
  }
}