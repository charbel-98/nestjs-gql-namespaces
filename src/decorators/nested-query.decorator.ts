import 'reflect-metadata';
import type { NamespaceDecoratorOptions, MethodMetadata } from '../core/types';
import { METADATA_KEYS } from '../core/types';

/**
 * Method decorator for GraphQL queries within a namespace.
 * Must be used on methods within a class decorated with @NamespaceResolver.
 */
export function NestedQuery(): MethodDecorator;
export function NestedQuery(returnTypeFn: () => any, options?: NamespaceDecoratorOptions): MethodDecorator;
export function NestedQuery(
  returnTypeFnOrOptions?: (() => any) | NamespaceDecoratorOptions,
  options: NamespaceDecoratorOptions = {},
): MethodDecorator {
  // Parse arguments
  let returnTypeFn: (() => any) | undefined;
  let actualOptions: NamespaceDecoratorOptions;

  if (typeof returnTypeFnOrOptions === 'function') {
    // NestedQuery(() => Boolean, options?)
    returnTypeFn = returnTypeFnOrOptions;
    actualOptions = options;
  } else {
    // NestedQuery() or NestedQuery(options?)
    returnTypeFn = undefined;
    actualOptions = returnTypeFnOrOptions || {};
  }

  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const fieldName = actualOptions.name || (propertyKey as string);

    // Store method metadata for later processing in @NamespaceResolver
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