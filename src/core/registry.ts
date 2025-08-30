import { Provider } from '@nestjs/common';
import { Mutation, Query, ObjectType, ResolveField, Resolver } from '@nestjs/graphql';
import type {
  INamespaceRegistry,
  GraphQLKind,
  NamespaceEdge,
  FieldMetadata,
  NamespaceRoot,
  RegistryStats,
} from './types';
import {
  normalizeNamespaceName,
  createDefaultTypeName,
  createResolverClassName,
  createLinkResolverClassName,
  createSegmentMappingKey,
  createLeafParentKey,
  createRootKey,
  edgesAreEqual,
  developmentWarn,
} from './utils';

class NamespaceRegistryImpl implements INamespaceRegistry {
  private readonly createdTypes = new Map<string, any>();
  private readonly roots = new Map<string, NamespaceRoot>();
  private readonly edges: NamespaceEdge[] = [];
  private readonly fields: FieldMetadata[] = [];
  private readonly classDefaultLeafType = new WeakMap<Function, string>();
  private readonly segmentToTypeName = new Map<string, string>();
  private readonly leafToParent = new Map<string, string>();
  private readonly dualResolvers: Function[] = [];
  private readonly originalResolvers: Function[] = [];

  setSegmentMapping(
    graphqlKind: GraphQLKind,
    segment: string,
    typeName: string,
    parentSegment?: string,
  ): void {
    const key = createSegmentMappingKey(graphqlKind, segment, parentSegment);
    const leafParentKey = createLeafParentKey(graphqlKind, segment);

    if (this.leafToParent.has(leafParentKey)) {
      const existingParent = this.leafToParent.get(leafParentKey);
      if (existingParent !== (parentSegment || '')) {
        throw new Error(
          `Segment "${segment}" is already mapped under "${existingParent || '<root>'}"`,
        );
      }
    }

    this.segmentToTypeName.set(key, typeName);
    this.leafToParent.set(leafParentKey, parentSegment || '');
    this.getOrCreateObjectType(typeName);
  }

  getSegmentMapping(
    graphqlKind: GraphQLKind,
    segment: string,
    parentSegment?: string,
  ): string | undefined {
    const key = createSegmentMappingKey(graphqlKind, segment, parentSegment);
    return this.segmentToTypeName.get(key);
  }

  private getParentForLeaf(graphqlKind: GraphQLKind, leaf: string): string | undefined {
    const key = createLeafParentKey(graphqlKind, leaf);
    return this.leafToParent.get(key);
  }

  getOrCreateObjectType(typeName: string): any {
    if (this.createdTypes.has(typeName)) {
      return this.createdTypes.get(typeName);
    }

    const cls = class {};
    Object.defineProperty(cls, 'name', { value: typeName });
    ObjectType(typeName)(cls);
    this.createdTypes.set(typeName, cls);
    return cls;
  }

  ensureRoot(graphqlKind: GraphQLKind, rootName: string, typeName?: string): NamespaceRoot {
    const normalizedRootName = normalizeNamespaceName(rootName);
    const key = createRootKey(graphqlKind, normalizedRootName);

    if (this.roots.has(key)) {
      return this.roots.get(key)!;
    }

    const resolvedTypeName = typeName || createDefaultTypeName(normalizedRootName, graphqlKind);
    this.getOrCreateObjectType(resolvedTypeName);

    const root: NamespaceRoot = { graphqlKind, typeName: resolvedTypeName };
    this.roots.set(key, root);
    return root;
  }

  ensureEdge(
    graphqlKind: GraphQLKind,
    segments: readonly string[],
    targetTypeName?: string,
  ): void {
    if (segments.length < 1) return;

    const rootName = segments[0];
    this.ensureRoot(graphqlKind, rootName);

    if (segments.length === 1) return; // leaf is root itself

    const last = segments[segments.length - 1];
    const inferredTypeName = targetTypeName || createDefaultTypeName(last, graphqlKind);
    const finalTypeName = targetTypeName || inferredTypeName;

    this.getOrCreateObjectType(finalTypeName);

    // Check for duplicate edges
    const newEdge: NamespaceEdge = {
      graphqlKind,
      segments: [...segments],
      targetTypeName: finalTypeName,
    };

    const exists = this.edges.find((edge) => edgesAreEqual(edge, newEdge));
    if (!exists) {
      this.edges.push(newEdge);
    }
  }

  registerField(meta: FieldMetadata): void {
    this.fields.push(meta);
  }

  setDefaultLeafTypeForClass(ctor: Function, typeName: string): void {
    this.classDefaultLeafType.set(ctor, typeName);
    this.getOrCreateObjectType(typeName);
  }

  getDefaultLeafTypeForClass(ctor: Function): string | undefined {
    return this.classDefaultLeafType.get(ctor);
  }

  mergeFieldsIntoNamespace(
    graphqlKind: GraphQLKind,
    namespace: string,
    targetTypeName: string,
  ): void {
    const segments = namespace.split('.').filter(Boolean);
    if (segments.length === 0) return;

    this.ensureEdge(graphqlKind, segments, targetTypeName);
  }

  hasFieldsForNamespace(graphqlKind: GraphQLKind, namespace: string): boolean {
    const segments = namespace.split('.').filter(Boolean);
    return this.fields.some(
      (field) =>
        field.graphqlKind === graphqlKind && field.segments.join('.') === segments.join('.'),
    );
  }

  registerDualResolver(resolver: Function): void {
    this.dualResolvers.push(resolver);
  }
  
  registerOriginalResolver(resolver: Function): void {
    if (!this.originalResolvers.includes(resolver)) {
      this.originalResolvers.push(resolver);
    }
  }

  getDualResolvers(): readonly Function[] {
    return this.dualResolvers;
  }
  
  getOriginalResolvers(): readonly Function[] {
    return this.originalResolvers;
  }

  getRegistryStats(): RegistryStats {
    return {
      createdTypes: this.createdTypes.size,
      roots: this.roots.size,
      edges: this.edges.length,
      fields: this.fields.length,
      mappings: this.segmentToTypeName.size,
    };
  }

  buildDynamicProviders(): Provider[] {
    const providers: Provider[] = [];

    // Group fields by namespace to determine what types to create
    const namespaceFieldsMap = new Map<string, { mutations: FieldMetadata[]; queries: FieldMetadata[] }>();

    // Build edges from collected fields
    for (const meta of this.fields) {
      let segments = [...meta.segments];

      // Resolve single segments using parent mappings
      if (segments.length === 1) {
        const leaf = segments[0];
        const parent = this.getParentForLeaf(meta.graphqlKind, leaf);
        if (parent) {
          segments = [parent, leaf];
        } else {
          segments = [leaf];
        }
      }

      // Track which namespaces have which types of fields
      const namespaceKey = segments.join('.');
      if (!namespaceFieldsMap.has(namespaceKey)) {
        namespaceFieldsMap.set(namespaceKey, { mutations: [], queries: [] });
      }
      const namespaceFields = namespaceFieldsMap.get(namespaceKey)!;
      if (meta.graphqlKind === 'Mutation') {
        namespaceFields.mutations.push(meta);
      } else {
        namespaceFields.queries.push(meta);
      }

      const rootName = segments[0];
      const parentSeg = segments.length > 1 ? segments[segments.length - 2] : undefined;
      const leafSeg = segments[segments.length - 1];
      const root = this.ensureRoot(meta.graphqlKind, rootName);
      const mapped = this.getSegmentMapping(meta.graphqlKind, leafSeg, parentSeg);
      const inferred = segments.length === 1
        ? root.typeName
        : createDefaultTypeName(leafSeg, meta.graphqlKind);
      const targetTypeName = mapped || inferred;

      this.ensureEdge(meta.graphqlKind, segments, targetTypeName);
    }

    // Build root resolvers
    for (const [key, root] of this.roots.entries()) {
      const [graphqlKind, rootName] = key.split(':') as [GraphQLKind, string];
      const RootType = this.getOrCreateObjectType(root.typeName);
      const className = createResolverClassName(root.typeName, 'RootResolver');

      const resolverClass = class {
        [rootName]() {
          return {};
        }
      } as any;

      Object.defineProperty(resolverClass, 'name', { value: className });
      Resolver()(resolverClass);

      if (graphqlKind === 'Mutation') {
        const mutationDescriptor = Object.getOwnPropertyDescriptor(resolverClass.prototype, rootName);
        if (mutationDescriptor) {
          Mutation(() => RootType)(
            resolverClass.prototype,
            rootName,
            mutationDescriptor as TypedPropertyDescriptor<any>,
          );
        }
      } else {
        const queryDescriptor = Object.getOwnPropertyDescriptor(resolverClass.prototype, rootName);
        if (queryDescriptor) {
          Query(() => RootType)(
            resolverClass.prototype,
            rootName,
            queryDescriptor as TypedPropertyDescriptor<any>,
          );
        }
      }
      providers.push(resolverClass);
    }

    // Build namespace link resolvers
    for (const edge of this.edges) {
      const parentSegments = edge.segments.slice(0, -1);
      const fieldName = edge.segments[edge.segments.length - 1];

      if (parentSegments.length === 0) {
        continue; // Root-level field, handled by root resolver
      }

      const normalizedParentRoot = normalizeNamespaceName(parentSegments[0]);
      const parentRootKey = createRootKey(edge.graphqlKind, normalizedParentRoot);
      const parentRoot = this.roots.get(parentRootKey);

      if (!parentRoot) {
        developmentWarn(
          `Parent root not found for key: ${parentRootKey}. Skipping edge for ${edge.segments.join('.')}`
        );
        continue;
      }

      const ParentType = this.getOrCreateObjectType(parentRoot.typeName);
      const ChildType = this.getOrCreateObjectType(edge.targetTypeName);
      const className = createLinkResolverClassName(parentRoot.typeName, fieldName);

      const resolverClass = class {
        [fieldName]() {
          return {};
        }
      } as any;

      Object.defineProperty(resolverClass, 'name', { value: className });
      Resolver(() => ParentType)(resolverClass);
      const resolveFieldDescriptor = Object.getOwnPropertyDescriptor(resolverClass.prototype, fieldName);
      if (resolveFieldDescriptor) {
        ResolveField(() => ChildType)(
          resolverClass.prototype,
          fieldName,
          resolveFieldDescriptor as TypedPropertyDescriptor<any>,
        );
      }
      providers.push(resolverClass);
    }

    return providers;
  }
}

// Export singleton instance
export const NamespaceRegistry: INamespaceRegistry = new NamespaceRegistryImpl();