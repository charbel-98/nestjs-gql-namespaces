import 'reflect-metadata';
import type { NamespaceDecoratorOptions, MethodMetadata } from '../core/types';
import { METADATA_KEYS } from '../core/types';

/**
 * Method decorator for GraphQL mutations within a namespace.
 * Works just like NestJS @Mutation decorator - no configuration needed!
 * 
 * @example
 * ```typescript
 * @NamespaceResolver({ fieldName: 'auth' })
 * export class AuthResolver {
 *   @NestedMutation(() => Boolean)
 *   async login(): Promise<boolean> { ... }  // Creates: mutation { auth { login } }
 * }
 * ```
 */
export function NestedMutation(): MethodDecorator;
export function NestedMutation(returnTypeFn: () => any, options?: NamespaceDecoratorOptions): MethodDecorator;
export function NestedMutation(
  returnTypeFnOrOptions?: (() => any) | NamespaceDecoratorOptions,
  options: NamespaceDecoratorOptions = {},
): MethodDecorator {
  // Parse arguments (same as NestJS @Mutation)
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
      graphqlKind: 'Mutation',
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