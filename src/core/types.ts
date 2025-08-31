import { Provider } from '@nestjs/common';

export type GraphQLKind = 'Mutation' | 'Query';

export interface NamespaceEdge {
  readonly graphqlKind: GraphQLKind;
  readonly segments: readonly string[];
  readonly targetTypeName: string;
}

export interface FieldMetadata {
  readonly graphqlKind: GraphQLKind;
  readonly segments: readonly string[];
  readonly fieldName: string;
  readonly returnTypeFn: () => any;
}

export interface NamespaceRoot {
  readonly graphqlKind: GraphQLKind;
  readonly typeName: string;
}

export interface MethodMetadata {
  readonly graphqlKind: GraphQLKind;
  readonly fieldName: string;
  readonly returnTypeFn?: (() => any) | undefined;
  readonly propertyKey: string | symbol;
  readonly options: NamespaceDecoratorOptions;
}

// Standard GraphQL field options that should be passed through
export interface NamespaceDecoratorOptions {
  readonly name?: string;
  readonly leafTypeName?: string;
  readonly graphqlKind?: GraphQLKind;
  readonly deprecationReason?: string;
  readonly description?: string;
  readonly complexity?: number;
  readonly middleware?: any[];
  readonly nullable?: boolean | 'items' | 'itemsAndList';
}

export interface NamespaceResolverOptions {
  readonly fieldName: string;
  readonly typeName?: string;
  readonly parentFieldName?: string;
  readonly graphqlKind?: GraphQLKind;
}

export interface RegistryStats {
  readonly createdTypes: number;
  readonly roots: number;
  readonly edges: number;
  readonly fields: number;
  readonly mappings: number;
  readonly modules: number;
}

export interface ModuleMetadata {
  readonly namespace: string;
  readonly moduleClass: Function;
  readonly providers: Provider[];
}

export interface SegmentMapping {
  readonly graphqlKind: GraphQLKind;
  readonly segment: string;
  readonly typeName: string;
  readonly parentSegment?: string;
}

// Internal registry interface (not exported from package)
export interface INamespaceRegistry {
  setSegmentMapping(
    graphqlKind: GraphQLKind,
    segment: string,
    typeName: string,
    parentSegment?: string,
  ): void;

  getSegmentMapping(
    graphqlKind: GraphQLKind,
    segment: string,
    parentSegment?: string,
  ): string | undefined;

  getOrCreateObjectType(typeName: string): any;

  ensureRoot(
    graphqlKind: GraphQLKind,
    rootName: string,
    typeName?: string,
  ): NamespaceRoot;

  ensureEdge(
    graphqlKind: GraphQLKind,
    segments: readonly string[],
    targetTypeName?: string,
  ): void;

  registerField(meta: FieldMetadata, targetTypeName?: string): void;

  setDefaultLeafTypeForClass(ctor: Function, typeName: string): void;

  getDefaultLeafTypeForClass(ctor: Function): string | undefined;

  mergeFieldsIntoNamespace(
    graphqlKind: GraphQLKind,
    namespace: string,
    targetTypeName: string,
  ): void;

  hasFieldsForNamespace(graphqlKind: GraphQLKind, namespace: string): boolean;

  registerDualResolver(resolver: Function): void;
  
  registerOriginalResolver(resolver: Function): void;

  getDualResolvers(): readonly Function[];
  
  getOriginalResolvers(): readonly Function[];

  buildDynamicProviders(): Provider[];

  registerModuleProvider(namespace: string, moduleClass: Function, providers: Provider[]): void;
  
  getModuleProviders(): ModuleMetadata[];

  getRegistryStats(): RegistryStats;
}

// Constants for metadata keys
export const METADATA_KEYS = {
  NAMESPACE_METHODS: 'nestjs-gql-namespaces:methods',
  GRAPHQL_NAMESPACE: 'nestjs-gql-namespaces:namespace',
  PROCESSED: 'nestjs-gql-namespaces:processed',
} as const;