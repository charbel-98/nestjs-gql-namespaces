import type { GraphQLKind } from './types';

/**
 * Converts PascalCase or kebab-case to camelCase
 */
export function normalizeNamespaceName(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts string to PascalCase
 */
export function pascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Creates a default type name for a given segment and GraphQL kind
 */
export function createDefaultTypeName(segment: string, graphqlKind: GraphQLKind): string {
  const suffix = graphqlKind === 'Mutation' ? 'Mutations' : 'Queries';
  return `${pascalCase(segment)}${suffix}`;
}

/**
 * Creates a shared type name for a namespace segment
 */
export function createSharedTypeName(segment: string, graphqlKind: GraphQLKind): string {
  const suffix = graphqlKind === 'Mutation' ? 'Mutations' : 'Queries';
  return `Shared${pascalCase(segment)}${suffix}`;
}

/**
 * Creates a resolver class name
 */
export function createResolverClassName(typeName: string, suffix = 'Resolver'): string {
  return `${typeName}${suffix}`;
}

/**
 * Creates a link resolver class name for namespace edges
 */
export function createLinkResolverClassName(parentTypeName: string, fieldName: string): string {
  return `${parentTypeName}_${fieldName}_LinkResolver`;
}

/**
 * Validates that a namespace string is not empty
 */
export function validateNamespace(namespace: string): void {
  if (!namespace || namespace.trim().length === 0) {
    throw new Error('Namespace cannot be empty');
  }
}

/**
 * Splits namespace into segments and filters out empty ones
 */
export function parseNamespaceSegments(namespace: string): string[] {
  return namespace.split('.').filter(Boolean);
}

/**
 * Creates a unique key for segment mapping
 */
export function createSegmentMappingKey(
  graphqlKind: GraphQLKind,
  segment: string,
  parentSegment?: string,
): string {
  return `${graphqlKind}:${parentSegment || ''}:${segment}`;
}

/**
 * Creates a unique key for leaf-to-parent mapping
 */
export function createLeafParentKey(graphqlKind: GraphQLKind, leaf: string): string {
  return `${graphqlKind}:${leaf}`;
}

/**
 * Creates a unique key for namespace roots
 */
export function createRootKey(graphqlKind: GraphQLKind, rootName: string): string {
  return `${graphqlKind}:${normalizeNamespaceName(rootName)}`;
}

/**
 * Validates that two edges don't conflict
 */
export function edgesAreEqual(
  edge1: { graphqlKind: GraphQLKind; segments: readonly string[]; targetTypeName: string },
  edge2: { graphqlKind: GraphQLKind; segments: readonly string[]; targetTypeName: string },
): boolean {
  return (
    edge1.graphqlKind === edge2.graphqlKind &&
    edge1.segments.join('.') === edge2.segments.join('.') &&
    edge1.targetTypeName === edge2.targetTypeName
  );
}

/**
 * Warns about potential issues in development
 */
export function developmentWarn(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[nestjs-gql-namespaces] ${message}`);
  }
}

