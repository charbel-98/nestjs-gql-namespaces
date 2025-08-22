/**
 * nestjs-gql-namespaces - Clean, type-safe nested namespace support for NestJS GraphQL
 * 
 * This package provides decorator-based namespaced GraphQL mutations and queries for NestJS,
 * allowing you to organize your GraphQL schema in a clean, hierarchical way.
 * 
 * @example
 * ```typescript
 * import { NamespaceResolver, NestedMutation, NestedQuery } from 'nestjs-gql-namespaces';
 * 
 * @NamespaceResolver({ fieldName: 'user' })
 * export class UserResolver {
 *   @NestedMutation()
 *   async createUser(): Promise<User> {
 *     // Implementation
 *   }
 * 
 *   @NestedQuery()
 *   async getProfile(): Promise<UserProfile> {
 *     // Implementation
 *   }
 * }
 * ```
 */

// Public API exports only
export { NamespaceResolver } from './decorators/namespace-resolver.decorator';
export { NestedMutation } from './decorators/nested-mutation.decorator';
export { NestedQuery } from './decorators/nested-query.decorator';

// Export the module for NestJS integration (internal use)
export { NamespaceModule } from './providers/namespace.module';

// Export public types for TypeScript users
export type {
  NamespaceResolverOptions,
  NamespaceDecoratorOptions,
  GraphQLKind,
} from './core/types';