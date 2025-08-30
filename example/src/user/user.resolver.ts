import { Args, Context } from '@nestjs/graphql';
import { NamespaceResolver, NestedMutation, NestedQuery } from 'nestjs-gql-namespaces';
import { UserService } from './user.service';
import { CreateUserInput, User, UserProfile } from './user.types';
import { Logger } from '@nestjs/common';

@NamespaceResolver({ fieldName: 'user' })
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(private readonly userService: UserService) { }

  @NestedMutation(() => User)
  async createUser(
    @Args('input') input: CreateUserInput,
    @Context() context: any,
  ): Promise<User> {
    const mockUser = context.user || { id: 'guest', email: 'guest@example.com', name: 'Guest User' };
    this.logger.log(`Creating user with input: ${JSON.stringify(input)}, context user: ${JSON.stringify(mockUser)}`);

    const createdUser = await this.userService.create(input, mockUser);
    this.logger.log(`User created successfully: ${createdUser.email}`);
    return createdUser;
  }
}