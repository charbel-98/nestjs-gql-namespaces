# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-08-22

### Added
- Initial release of `nestjs-gql-namespaces`
- `@NamespaceResolver` decorator for creating namespace resolvers
- `@NestedMutation` decorator for GraphQL mutations within namespaces
- `@NestedQuery` decorator for GraphQL queries within namespaces
- Full TypeScript support with comprehensive type definitions
- Automatic type name generation with sensible defaults
- Support for dual resolvers (both mutations and queries in same class)
- Nested namespace support with parent/child relationships
- Clean, modular architecture with internal encapsulation
- Comprehensive documentation and examples

### Features
- Zero-configuration setup with sensible defaults
- Automatic GraphQL type generation
- Support for custom return types
- Flexible namespace organization
- Development-friendly warnings and error messages
- TypeScript return type inference
- Clean public API with only 3 exported decorators

## Migration from Original Implementation

This package is extracted and improved from the original `nested.ts` file with the following enhancements:

- **Better naming**: `NestedGraphQLRegistry` → `NamespaceRegistry` (internal)
- **Modular design**: Split 586-line monolith into focused modules
- **Clean API**: Export only public decorators, hide internal implementation
- **Improved types**: Better TypeScript support and type safety
- **Enhanced documentation**: Comprehensive examples and migration guide
- **Better error handling**: More descriptive error messages and warnings