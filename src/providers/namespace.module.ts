import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NamespaceRegistry } from '../core/registry';

/**
 * Dynamic module that provides namespace resolvers for GraphQL.
 * This module is internal and should not be imported directly by consumers.
 */
@Module({})
export class NamespaceModule {
  /**
   * Creates a dynamic module with all namespace resolvers.
   * Must be called after all @NamespaceResolver decorators have been processed.
   * @param additionalProviders - Additional providers to include (e.g., services)
   */
  static forRoot(additionalProviders: Provider[] = []): DynamicModule {
    const dynamicProviders = NamespaceRegistry.buildDynamicProviders();
    const dualResolvers = NamespaceRegistry.getDualResolvers();
    const originalResolvers = NamespaceRegistry.getOriginalResolvers();
    
    // Combine all providers, casting to satisfy TypeScript
    const allProviders: Provider[] = [
      ...additionalProviders, // User-provided services
      ...dynamicProviders,
      ...(dualResolvers as Provider[]),
      ...(originalResolvers as Provider[]), // Include original resolvers for DI
    ];

    return {
      module: NamespaceModule,
      providers: allProviders,
      exports: allProviders,
      global: true,
    };
  }
}