import 'reflect-metadata';
import { Resolver, ResolveField } from '@nestjs/graphql';
import type { NamespaceResolverOptions, MethodMetadata, GraphQLKind } from '../core/types';
import { METADATA_KEYS } from '../core/types';
import { NamespaceRegistry } from '../core/registry';
import { createDefaultTypeName, developmentWarn } from '../core/utils';

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
    ResolveField(finalReturnTypeFn, { name: methodMeta.fieldName })(
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
  const ResolverClass = class {} as any;
  Object.defineProperty(ResolverClass, 'name', { value: className });

  // Copy methods to new resolver class
  for (const methodMeta of methods) {
    const descriptor = Object.getOwnPropertyDescriptor(originalTarget.prototype, methodMeta.propertyKey);
    if (descriptor) {
      Object.defineProperty(ResolverClass.prototype, methodMeta.propertyKey, descriptor);

      const finalReturnTypeFn = methodMeta.returnTypeFn || (() => {
        const returnType = Reflect.getMetadata('design:returntype', originalTarget.prototype, methodMeta.propertyKey);
        return returnType === Promise ? String : (returnType || String);
      });

      ResolveField(finalReturnTypeFn, { name: methodMeta.fieldName })(
        ResolverClass.prototype,
        methodMeta.propertyKey,
        descriptor as TypedPropertyDescriptor<any>,
      );
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