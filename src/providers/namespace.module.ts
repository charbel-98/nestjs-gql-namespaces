import { Module, Global, DynamicModule, OnModuleInit } from '@nestjs/common';
import { getNamespaceRootResolvers } from '../decorators/namespace-resolver.decorator';

/**
 * Global module that enables namespace resolvers for GraphQL.
 * Works automatically without any configuration - just import it.
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     GraphQLModule.forRoot({ ... }),
 *     NamespaceModule, // Just import it, no configuration needed
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class NamespaceModule implements OnModuleInit {
  
  static forRoot(): DynamicModule {
    // Get all dynamically created root resolvers
    const rootResolvers = getNamespaceRootResolvers();
    
    return {
      module: NamespaceModule,
      providers: rootResolvers,
      exports: rootResolvers,
      global: true,
    };
  }
  
  onModuleInit() {
    // This ensures the module initializes after decorators have run
  }
}