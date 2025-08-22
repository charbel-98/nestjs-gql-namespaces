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
   */
  static forRoot(): DynamicModule {
    const dynamicProviders = NamespaceRegistry.buildDynamicProviders();
    const dualResolvers = NamespaceRegistry.getDualResolvers();
    
    // Combine all providers, casting to satisfy TypeScript
    const allProviders: Provider[] = [
      ...dynamicProviders,
      ...(dualResolvers as Provider[]),
    ];

    return {
      module: NamespaceModule,
      providers: allProviders,
      exports: allProviders,
      global: true,
    };
  }
}