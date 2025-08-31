export type GraphQLKind = 'Mutation' | 'Query';


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



// Constants for metadata keys
export const METADATA_KEYS = {
  NAMESPACE_METHODS: 'nestjs-gql-namespaces:methods',
  GRAPHQL_NAMESPACE: 'nestjs-gql-namespaces:namespace',
  PROCESSED: 'nestjs-gql-namespaces:processed',
} as const;