import { Args, Context } from '@nestjs/graphql';
import { NamespaceResolver, NestedMutation, NestedQuery } from 'nestjs-gql-namespaces';
import { User } from '../user/user.types';
import { AuthService } from './auth.service';
import { AuthResult, LoginInput } from './auth.types';
import { Logger } from '@nestjs/common';

@NamespaceResolver({ fieldName: 'auth' })
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(private readonly authService: AuthService) { }

  @NestedMutation(() => AuthResult)
  async login(
    @Args('credentials') credentials: LoginInput,
    @Context() context: any,
  ): Promise<AuthResult> {
    const mockUser = context.user || { id: 'guest', email: 'guest@example.com', name: 'Guest User' };
    this.logger.log(`Login attempt for email: ${credentials.email}, context user: ${JSON.stringify(mockUser)}`);
    
    const result = await this.authService.login(credentials, mockUser);
    this.logger.log(`Login successful for user: ${result.user.email}`);
    return result;
  }

  @NestedMutation(() => Boolean)
  async logout(@Context() context: any): Promise<boolean> {
    const mockUser = context.user || { id: 'guest', email: 'guest@example.com', name: 'Guest User' };
    this.logger.log(`Logout request from context user: ${JSON.stringify(mockUser)}`);
    
    const result = await this.authService.logout(mockUser);
    this.logger.log(`Logout successful for user: ${mockUser.email}`);
    return result;
  }

  @NestedQuery(() => User)
  async me(@Context() context: any): Promise<User> {
    const mockUser = context.user || { id: 'guest', email: 'guest@example.com', name: 'Guest User' };
    this.logger.log(`Fetching current user, context user: ${JSON.stringify(mockUser)}`);
    
    const user = await this.authService.getCurrentUser(mockUser);
    this.logger.log(`Returning user data for: ${user.email}`);
    return user;
  }
}