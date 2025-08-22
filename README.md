# nestjs-gql-namespaces

Clean, type-safe nested namespace support for NestJS GraphQL with decorator-based API.

## Features

- 🎯 **Clean API**: Export only 3 decorators (`@NamespaceResolver`, `@NestedMutation`, `@NestedQuery`)
- 📦 **Modular Design**: Well-structured, maintainable codebase split into focused modules
- 🔒 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🚀 **Zero Config**: Works out of the box with sensible defaults
- 🔧 **Flexible**: Support for both mutations and queries in the same resolver
- 📖 **Documentation**: Comprehensive examples and migration guides

## Installation

```bash
npm install nestjs-gql-namespaces
# or
yarn add nestjs-gql-namespaces
```

## Quick Start

### 1. Basic Usage

```typescript
import { NamespaceResolver, NestedMutation, NestedQuery } from 'nestjs-gql-namespaces';

@NamespaceResolver({ fieldName: 'user' })
export class UserResolver {
  @NestedMutation()
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    // Creates: mutation { user { createUser(input: ...) { ... } } }
    return this.userService.create(input);
  }

  @NestedQuery()
  async profile(@Args('id') id: string): Promise<UserProfile> {
    // Creates: query { user { profile(id: ...) { ... } } }
    return this.userService.getProfile(id);
  }
}
```

### 2. Module Setup

```typescript
import { Module } from '@nestjs/common';
import { NamespaceModule } from 'nestjs-gql-namespaces';
import { UserResolver } from './user.resolver';

@Module({
  imports: [
    NamespaceModule.forRoot(), // Add this to enable namespace resolvers
  ],
  providers: [UserResolver],
})
export class AppModule {}
```

## Advanced Usage

### Nested Namespaces

```typescript
@NamespaceResolver({ 
  fieldName: 'profile',
  parentFieldName: 'user' // Creates user.profile namespace
})
export class UserProfileResolver {
  @NestedMutation()
  async updateBio(@Args('bio') bio: string): Promise<string> {
    // Creates: mutation { user { profile { updateBio(bio: ...) } } }
    return this.profileService.updateBio(bio);
  }
}
```

### Custom Return Types

```typescript
@NamespaceResolver({ fieldName: 'admin' })
export class AdminResolver {
  @NestedMutation(() => AdminResult) // Explicit return type
  async deleteUser(@Args('id') id: string): Promise<AdminResult> {
    return this.adminService.deleteUser(id);
  }

  @NestedQuery(() => [User]) // Array return type
  async getAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }
}
```

### Mixed Mutation and Query Resolvers

```typescript
@NamespaceResolver({ fieldName: 'auth' })
export class AuthResolver {
  @NestedMutation()
  async login(@Args('credentials') credentials: LoginInput): Promise<AuthResult> {
    return this.authService.login(credentials);
  }

  @NestedMutation()
  async logout(): Promise<boolean> {
    return this.authService.logout();
  }

  @NestedQuery()
  async me(): Promise<User> {
    return this.authService.getCurrentUser();
  }
}
```

## Migration from Original Implementation

If you're migrating from the original `nested.ts` implementation:

### Before (Original)
```typescript
import { NestedMutation, NamespaceResolver } from '../common/graphql/nested';

@NamespaceResolver({
  fieldName: 'user',
  objectTypeName: 'UserMutations', // Manual type naming
  rootKind: 'Mutation'
})
export class UserResolver {
  @NestedMutation()
  async createUser(): Promise<User> { /* ... */ }
}
```

### After (New Package)
```typescript
import { NestedMutation, NamespaceResolver } from 'nestjs-gql-namespaces';

@NamespaceResolver({ 
  fieldName: 'user' // Simplified - type names auto-generated
})
export class UserResolver {
  @NestedMutation()
  async createUser(): Promise<User> { /* ... */ }
}
```

### Key Changes
- ✅ Cleaner import: `nestjs-gql-namespaces` instead of relative paths
- ✅ Simplified configuration: No need for `objectTypeName` or `rootKind`
- ✅ Better naming: Auto-generated type names follow conventions
- ✅ Improved TypeScript support
- ✅ Better error messages and warnings

## API Reference

### `@NamespaceResolver(options)`

Class decorator that creates namespace resolvers.

**Options:**
- `fieldName: string` - The GraphQL field name for this namespace
- `typeName?: string` - Custom type name (auto-generated if not provided)
- `parentFieldName?: string` - Parent namespace for nested resolvers
- `graphqlKind?: 'Mutation' | 'Query'` - Override default behavior

### `@NestedMutation(returnType?, options?)`

Method decorator for GraphQL mutations within a namespace.

**Parameters:**
- `returnType?: () => any` - Return type function (inferred if not provided)
- `options?: { name?: string }` - Decorator options

### `@NestedQuery(returnType?, options?)`

Method decorator for GraphQL queries within a namespace.

**Parameters:**
- `returnType?: () => any` - Return type function (inferred if not provided)  
- `options?: { name?: string }` - Decorator options

## Generated GraphQL Schema

With the examples above, your GraphQL schema will look like:

```graphql
type Mutation {
  user: UserMutations!
  auth: AuthMutations!
}

type Query {
  user: UserQueries!
  auth: AuthQueries!
}

type UserMutations {
  createUser(input: CreateUserInput!): User!
}

type UserQueries {
  profile(id: String!): UserProfile!
}

type AuthMutations {
  login(credentials: LoginInput!): AuthResult!
  logout: Boolean!
}

type AuthQueries {
  me: User!
}
```

## Requirements

- NestJS ^10.0.0
- @nestjs/graphql ^12.0.0
- TypeScript ^5.0.0
- Node.js ^18.0.0

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.