import 'reflect-metadata';
import type { NamespaceDecoratorOptions, MethodMetadata } from '../core/types';
import { METADATA_KEYS } from '../core/types';

/**
 * Method decorator for GraphQL queries within a namespace.
 * Works just like NestJS @Query decorator - no configuration needed!
 * 
 * @example
 * ```typescript
 * @NamespaceResolver({ fieldName: 'auth' })
 * export class AuthResolver {
 *   @NestedQuery(() => User)
 *   async me(): Promise<User> { ... }  // Creates: query { auth { me } }
 * }
 * ```
 */
export function NestedQuery(): MethodDecorator;
export function NestedQuery(returnTypeFn: () => any, options?: NamespaceDecoratorOptions): MethodDecorator;
export function NestedQuery(
  returnTypeFnOrOptions?: (() => any) | NamespaceDecoratorOptions,
  options: NamespaceDecoratorOptions = {},
): MethodDecorator {
  // Parse arguments (same as NestJS @Query)
  let returnTypeFn: (() => any) | undefined;
  let actualOptions: NamespaceDecoratorOptions;

  if (typeof returnTypeFnOrOptions === 'function') {
    returnTypeFn = returnTypeFnOrOptions;
    actualOptions = options;
  } else {
    returnTypeFn = undefined;
    actualOptions = returnTypeFnOrOptions || {};
  }

  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const fieldName = actualOptions.name || (propertyKey as string);

    // Store method metadata for processing by @NamespaceResolver
    const methodMeta: MethodMetadata = {
      graphqlKind: 'Query',
      fieldName,
      returnTypeFn,
      propertyKey,
      options: actualOptions,
    };

    const existingMethods: MethodMetadata[] = Reflect.getMetadata(METADATA_KEYS.NAMESPACE_METHODS, target.constructor) || [];
    existingMethods.push(methodMeta);
    Reflect.defineMetadata(METADATA_KEYS.NAMESPACE_METHODS, existingMethods, target.constructor);

    return descriptor;
  };
}