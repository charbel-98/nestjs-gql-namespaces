import 'reflect-metadata';
import { Resolver, ResolveField, Args, Context, Info, Root } from '@nestjs/graphql';
import type { NamespaceResolverOptions, MethodMetadata, GraphQLKind } from '../core/types';
import { METADATA_KEYS } from '../core/types';
import { NamespaceRegistry } from '../core/registry';
import { createDefaultTypeName, developmentWarn } from '../core/utils';

/**
 * Creates GraphQL field options from namespace decorator options
 */
function createResolveFieldOptions(methodMeta: MethodMetadata): any {
  const resolveFieldOptions: any = {
    name: methodMeta.fieldName,
  };

  // Pass through all GraphQL field options
  if (methodMeta.options.deprecationReason) {
    resolveFieldOptions.deprecationReason = methodMeta.options.deprecationReason;
  }
  if (methodMeta.options.description) {
    resolveFieldOptions.description = methodMeta.options.description;
  }
  if (methodMeta.options.complexity !== undefined) {
    resolveFieldOptions.complexity = methodMeta.options.complexity;
  }
  if (methodMeta.options.middleware) {
    resolveFieldOptions.middleware = methodMeta.options.middleware;
  }
  if (methodMeta.options.nullable !== undefined) {
    resolveFieldOptions.nullable = methodMeta.options.nullable;
  }

  return resolveFieldOptions;
}


/**
 * Class decorator that creates namespace resolvers for GraphQL mutations and queries.
 * Processes methods decorated with @NestedMutation and @NestedQuery.
 */
export function NamespaceResolver(options: NamespaceResolverOptions): ClassDecorator {
  return (target: any) => {
    // Calculate namespace for this resolver
    const namespace = options.parentFieldName
      ? `${options.parentFieldName}.${options.fieldName}`
      : options.fieldName;

    // Store namespace metadata
    Reflect.defineMetadata(METADATA_KEYS.GRAPHQL_NAMESPACE, namespace, target);

    // Process all deferred method decorators
    const methodMetas: MethodMetadata[] = Reflect.getMetadata(METADATA_KEYS.NAMESPACE_METHODS, target) || [];

    // Group methods by GraphQL kind
    const mutationMethods = methodMetas.filter((m) => m.graphqlKind === 'Mutation');
    const queryMethods = methodMetas.filter((m) => m.graphqlKind === 'Query');

    // Process mutation methods
    for (const methodMeta of mutationMethods) {
      processMethodMetadata(target, methodMeta, namespace, 'Mutation');
    }

    // Process query methods
    for (const methodMeta of queryMethods) {
      processMethodMetadata(target, methodMeta, namespace, 'Query');
    }

    // Clear processed methods
    Reflect.deleteMetadata(METADATA_KEYS.NAMESPACE_METHODS, target);

    // Determine resolver creation strategy
    const hasMutations = mutationMethods.length > 0;
    const hasQueries = queryMethods.length > 0;

    if (hasMutations && hasQueries) {
      createDualResolvers(target, options, mutationMethods, queryMethods);
    } else if (hasMutations) {
      createSingleResolver(target, options, mutationMethods, 'Mutation');
    } else if (hasQueries) {
      createSingleResolver(target, options, queryMethods, 'Query');
    }
  };
}

function processMethodMetadata(
  target: any,
  methodMeta: MethodMetadata,
  namespace: string,
  graphqlKind: GraphQLKind,
): void {
  const segments = namespace.split('.').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('NamespaceResolver requires a non-empty namespace');
  }

  // Resolve return type
  const finalReturnTypeFn = methodMeta.returnTypeFn || (() => {
    const returnType = Reflect.getMetadata('design:returntype', target.prototype, methodMeta.propertyKey);
    if (returnType === Promise) {
      developmentWarn(`Cannot infer async return type for ${String(methodMeta.propertyKey)}. Please specify explicitly.`);
      return String;
    }
    return returnType || String;
  });

  // Register field in the registry
  NamespaceRegistry.registerField({
    graphqlKind,
    segments,
    fieldName: methodMeta.fieldName,
    returnTypeFn: finalReturnTypeFn,
  });
}

function createDualResolvers(
  target: any,
  options: NamespaceResolverOptions,
  mutationMethods: MethodMetadata[],
  queryMethods: MethodMetadata[],
): void {
  // Create mutation resolver
  const mutationType = getOrCreateNamespaceType({ ...options, graphqlKind: 'Mutation' });
  const MutationResolverClass = createResolverClass(
    target,
    `${target.name}MutationResolver`,
    mutationMethods,
    mutationType,
  );
  NamespaceRegistry.registerDualResolver(MutationResolverClass);

  // Create query resolver
  const queryType = getOrCreateNamespaceType({ ...options, graphqlKind: 'Query' });
  const QueryResolverClass = createResolverClass(
    target,
    `${target.name}QueryResolver`,
    queryMethods,
    queryType,
  );
  NamespaceRegistry.registerDualResolver(QueryResolverClass);

  // Also register the original class so it can be injected for dependencies
  NamespaceRegistry.registerOriginalResolver(target);

  // Mark original class as processed
  Reflect.defineMetadata(METADATA_KEYS.PROCESSED, true, target);
}

function createSingleResolver(
  target: any,
  options: NamespaceResolverOptions,
  methods: MethodMetadata[],
  graphqlKind: GraphQLKind,
): void {
  const resolverType = getOrCreateNamespaceType({ ...options, graphqlKind });
  Resolver(() => resolverType)(target);

  // Attach ResolveField decorators
  for (const methodMeta of methods) {
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

    const resolveFieldOptions = createResolveFieldOptions(methodMeta);
    ResolveField(finalReturnTypeFn, resolveFieldOptions)(
      target.prototype,
      methodMeta.propertyKey,
      descriptor as TypedPropertyDescriptor<any>,
    );
  }
}

function createResolverClass(
  originalTarget: any,
  className: string,
  methods: MethodMetadata[],
  resolverType: any,
): any {
  // Create a class that extends the original to preserve DI and context
  const ResolverClass = class extends originalTarget {} as any;
  Object.defineProperty(ResolverClass, 'name', { value: className });

  // Store the original target reference for later use
  Reflect.defineMetadata('original:target', originalTarget, ResolverClass);

  // Process methods on the new resolver class
  for (const methodMeta of methods) {
    const descriptor = Object.getOwnPropertyDescriptor(originalTarget.prototype, methodMeta.propertyKey);
    if (descriptor) {
      // No need to redefine methods since we're extending the original class
      // The methods are already inherited

      // Copy all metadata from original method to new class method
      const metadataKeys = Reflect.getMetadataKeys(originalTarget.prototype, methodMeta.propertyKey);
      for (const key of metadataKeys) {
        const metadataValue = Reflect.getMetadata(key, originalTarget.prototype, methodMeta.propertyKey);
        Reflect.defineMetadata(key, metadataValue, ResolverClass.prototype, methodMeta.propertyKey);
      }

      // Copy parameter types metadata
      const paramTypes = Reflect.getMetadata('design:paramtypes', originalTarget.prototype, methodMeta.propertyKey);
      if (paramTypes) {
        Reflect.defineMetadata('design:paramtypes', paramTypes, ResolverClass.prototype, methodMeta.propertyKey);
      }

      // Copy parameter decorator metadata (Args, Context, etc.)
      const paramMetadata = Reflect.getMetadata('__routeArguments__', originalTarget, methodMeta.propertyKey);
      if (paramMetadata) {
        Reflect.defineMetadata('__routeArguments__', paramMetadata, ResolverClass, methodMeta.propertyKey);
      }

      const finalReturnTypeFn = methodMeta.returnTypeFn || (() => {
        const returnType = Reflect.getMetadata('design:returntype', originalTarget.prototype, methodMeta.propertyKey);
        return returnType === Promise ? String : (returnType || String);
      });

      const resolveFieldOptions = createResolveFieldOptions(methodMeta);
      
      // Apply ResolveField decorator with parameter decorators
      const resolveFieldDecorator = ResolveField(finalReturnTypeFn, resolveFieldOptions);
      const newDescriptor = Object.getOwnPropertyDescriptor(ResolverClass.prototype, methodMeta.propertyKey);
      resolveFieldDecorator(ResolverClass.prototype, methodMeta.propertyKey, newDescriptor as TypedPropertyDescriptor<any>);
      
      // Re-apply parameter decorators to ensure they work with the new class
      if (paramMetadata) {
        for (const [key, paramValue] of Object.entries(paramMetadata) as [string, any][]) {
          const [paramType, indexStr] = key.split(':');
          const index = parseInt(indexStr);
          
          switch (paramType) {
            case '1': // CONTEXT
              Context(paramValue.data)(ResolverClass.prototype, methodMeta.propertyKey, index);
              break;
            case '3': // ARGS
              Args(paramValue.data)(ResolverClass.prototype, methodMeta.propertyKey, index);
              break;
            case '2': // INFO
              Info()(ResolverClass.prototype, methodMeta.propertyKey, index);
              break;
            case '0': // ROOT
              Root()(ResolverClass.prototype, methodMeta.propertyKey, index);
              break;
          }
        }
      }
    }
  }

  Resolver(() => resolverType)(ResolverClass);
  return ResolverClass;
}

function getOrCreateNamespaceType(options: {
  fieldName: string;
  typeName?: string;
  parentFieldName?: string;
  graphqlKind?: GraphQLKind;
}): any {
  const graphqlKind = options.graphqlKind || 'Mutation';
  const finalTypeName = options.typeName || createDefaultTypeName(options.fieldName, graphqlKind);

  if (options.fieldName) {
    NamespaceRegistry.setSegmentMapping(
      graphqlKind,
      options.fieldName,
      finalTypeName,
      options.parentFieldName,
    );
  }

  return NamespaceRegistry.getOrCreateObjectType(finalTypeName);
}