import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { NamespaceModule } from 'nestjs-gql-namespaces';
import { join } from 'path';
import { AdminResolver } from './admin/admin.resolver';
import { AdminService } from './admin/admin.service';
import { AuthResolver } from './auth/auth.resolver';
import { AuthService } from './auth/auth.service';
import { UserResolver } from './user/user.resolver';
import { UserService } from './user/user.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: {
        path: join(process.cwd(), 'src/schema.gql'),
      },
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      introspection: true,
      context: ({ req }) => {
        // Mock user data - in a real app, this would come from JWT/session
        const mockUser = {
          id: 'user123',
          email: 'context.user@example.com',
          name: 'Context User',
          role: 'admin',
          bio: 'User from context',
        };

        // You can switch between different mock users based on headers or other criteria
        // For example, check for an auth header to determine the user
        const authHeader = req?.headers?.authorization;

        if (authHeader === 'Bearer guest-token') {
          return {
            user: {
              id: 'guest',
              email: 'guest@example.com',
              name: 'Guest User',
              role: 'guest',
            },
          };
        }

        // Default authenticated user
        return {
          user: mockUser,
        };
      },
    }),
    NamespaceModule.forRoot([
      UserService,
      AuthService,
      AdminService,
    ]),
  ],
  providers: [
    UserResolver,
    AuthResolver,
    AdminResolver,
    UserService,
    AuthService,
    AdminService,
  ],
  exports: [
    UserService,
    AuthService,
    AdminService,
  ],
})
export class AppModule { }