import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NamespaceRegistry } from '../core/registry';

/**
 * Dynamic module that provides namespace resolvers for GraphQL.
 * This module is internal and should not be imported directly by consumers.
 */
@Module({})
export class NamespaceModule {
  /**
   * Creates a dynamic module that automatically discovers providers from namespace resolvers.
   * Each namespace should have its own module with providers that register themselves.
   */
  static forRootAsync(): DynamicModule {
    const dynamicProviders = NamespaceRegistry.buildDynamicProviders();
    const dualResolvers = NamespaceRegistry.getDualResolvers();
    const originalResolvers = NamespaceRegistry.getOriginalResolvers();
    
    // Get providers from registered modules
    const moduleProviders = NamespaceRegistry.getModuleProviders();
    const allModuleProviders = moduleProviders.flatMap(m => m.providers);
    
    // Combine all providers
    const allProviders: Provider[] = [
      ...allModuleProviders, // Providers from namespace modules
      ...dynamicProviders,
      ...(dualResolvers as Provider[]),
      ...(originalResolvers as Provider[]),
    ];

    return {
      module: NamespaceModule,
      providers: allProviders,
      exports: allProviders,
      global: true,
    };
  }
}