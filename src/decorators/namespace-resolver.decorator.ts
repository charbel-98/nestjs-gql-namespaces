import 'reflect-metadata';
import { Resolver, ResolveField, Query, Mutation, ObjectType } from '@nestjs/graphql';
import type { NamespaceResolverOptions, MethodMetadata } from '../core/types';
import { METADATA_KEYS } from '../core/types';

/**
 * Creates GraphQL field options from namespace decorator options
 */
function createFieldOptions(methodMeta: MethodMetadata): any {
  const fieldOptions: any = {
    name: methodMeta.fieldName,
  };

  // Pass through all GraphQL field options
  if (methodMeta.options.deprecationReason) {
    fieldOptions.deprecationReason = methodMeta.options.deprecationReason;
  }
  if (methodMeta.options.description) {
    fieldOptions.description = methodMeta.options.description;
  }
  if (methodMeta.options.complexity !== undefined) {
    fieldOptions.complexity = methodMeta.options.complexity;
  }
  if (methodMeta.options.middleware) {
    fieldOptions.middleware = methodMeta.options.middleware;
  }
  if (methodMeta.options.nullable !== undefined) {
    fieldOptions.nullable = methodMeta.options.nullable;
  }

  return fieldOptions;
}

/**
 * Creates a GraphQL ObjectType for the namespace
 */
function createNamespaceType(fieldName: string, typeName?: string): any {
  const finalTypeName = typeName || `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Namespace`;
  
  // Create the class dynamically
  const cls = class {};
  Object.defineProperty(cls, 'name', { value: finalTypeName });
  
  // Apply ObjectType decorator
  ObjectType(finalTypeName)(cls);
  
  return cls;
}

/**
 * Class decorator that creates namespace resolvers for GraphQL mutations and queries.
 * Works just like NestJS's @Resolver, @Query, @Mutation - no configuration needed!
 * 
 * @example
 * ```typescript
 * @NamespaceResolver({ fieldName: 'auth' })
 * export class AuthResolver {
 *   @NestedMutation(() => Boolean)
 *   async login(): Promise<boolean> { ... }
 *   
 *   @NestedQuery(() => User)  
 *   async me(): Promise<User> { ... }
 * }
 * ```
 * 
 * This automatically creates:
 * - mutation { auth { login } }
 * - query { auth { me } }
 */
export function NamespaceResolver(options: NamespaceResolverOptions): ClassDecorator {
  return (target: any) => {
    // Get all the methods that were decorated with @NestedQuery or @NestedMutation
    const methodMetas: MethodMetadata[] = Reflect.getMetadata(METADATA_KEYS.NAMESPACE_METHODS, target) || [];
    
    if (methodMetas.length === 0) {
      return; // No methods to process
    }
    
    // Create the namespace ObjectType
    const NamespaceType = createNamespaceType(options.fieldName, options.typeName);
    
    // Group methods by type
    const mutationMethods = methodMetas.filter(m => m.graphqlKind === 'Mutation');
    const queryMethods = methodMetas.filter(m => m.graphqlKind === 'Query');
    
    // Apply @Resolver decorator to make this class a GraphQL resolver
    Resolver(() => NamespaceType)(target);
    
    // Transform each nested method into a ResolveField
    for (const methodMeta of methodMetas) {
      const finalReturnTypeFn = methodMeta.returnTypeFn || (() => {
        const returnType = Reflect.getMetadata('design:returntype', target.prototype, methodMeta.propertyKey);
        return returnType === Promise ? String : (returnType || String);
      });
      
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodMeta.propertyKey) || {
        value: target.prototype[methodMeta.propertyKey],
        writable: true,
        enumerable: false,
        configurable: true,
      };
      
      const fieldOptions = createFieldOptions(methodMeta);
      ResolveField(finalReturnTypeFn, fieldOptions)(
        target.prototype,
        methodMeta.propertyKey,
        descriptor as TypedPropertyDescriptor<any>
      );
    }
    
    // Now we need to create the root field resolvers that return the namespace object
    // We'll create separate resolver classes for this
    
    if (mutationMethods.length > 0) {
      createRootMutationResolver(options.fieldName, NamespaceType);
    }
    
    if (queryMethods.length > 0) {
      createRootQueryResolver(options.fieldName, NamespaceType);
    }
    
    // Clean up
    Reflect.deleteMetadata(METADATA_KEYS.NAMESPACE_METHODS, target);
  };
}

// Registry to store root resolvers that need to be created
const NAMESPACE_ROOT_RESOLVERS: { [key: string]: any } = {};

/**
 * Creates a root mutation resolver that returns the namespace object
 */
function createRootMutationResolver(fieldName: string, NamespaceType: any): any {
  const className = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}MutationResolver`;
  
  // Check if we already have this resolver
  if (NAMESPACE_ROOT_RESOLVERS[`Mutation:${fieldName}`]) {
    return NAMESPACE_ROOT_RESOLVERS[`Mutation:${fieldName}`];
  }
  
  const RootMutationResolver = class {
    [fieldName]() {
      return {}; // Empty object that the nested resolvers will populate
    }
  } as any;
  
  Object.defineProperty(RootMutationResolver, 'name', { value: className });
  
  // Apply decorators
  Resolver()(RootMutationResolver);
  
  const descriptor = Object.getOwnPropertyDescriptor(RootMutationResolver.prototype, fieldName);
  if (descriptor) {
    Mutation(() => NamespaceType)(
      RootMutationResolver.prototype,
      fieldName,
      descriptor as TypedPropertyDescriptor<any>
    );
  }
  
  NAMESPACE_ROOT_RESOLVERS[`Mutation:${fieldName}`] = RootMutationResolver;
  return RootMutationResolver;
}

/**
 * Creates a root query resolver that returns the namespace object  
 */
function createRootQueryResolver(fieldName: string, NamespaceType: any): any {
  const className = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}QueryResolver`;
  
  // Check if we already have this resolver
  if (NAMESPACE_ROOT_RESOLVERS[`Query:${fieldName}`]) {
    return NAMESPACE_ROOT_RESOLVERS[`Query:${fieldName}`];
  }
  
  const RootQueryResolver = class {
    [fieldName]() {
      return {}; // Empty object that the nested resolvers will populate
    }
  } as any;
  
  Object.defineProperty(RootQueryResolver, 'name', { value: className });
  
  // Apply decorators
  Resolver()(RootQueryResolver);
  
  const descriptor = Object.getOwnPropertyDescriptor(RootQueryResolver.prototype, fieldName);
  if (descriptor) {
    Query(() => NamespaceType)(
      RootQueryResolver.prototype,
      fieldName,
      descriptor as TypedPropertyDescriptor<any>
    );
  }
  
  NAMESPACE_ROOT_RESOLVERS[`Query:${fieldName}`] = RootQueryResolver;
  return RootQueryResolver;
}

/**
 * Get all created root resolvers for registration with NestJS
 */
export function getNamespaceRootResolvers(): any[] {
  return Object.values(NAMESPACE_ROOT_RESOLVERS);
}

