# NestJS GraphQL Namespaces - Critical Fixes Documentation

## Overview

This document outlines the critical fixes applied to the `nestjs-gql-namespaces` package to resolve issues with argument generation and context resolution in nested GraphQL queries and mutations.

## Issues Fixed

### 1. ❌ **Missing Arguments in Generated Schema**
**Problem**: The generated GraphQL schema was missing arguments for nested queries and mutations, resulting in schema like:
```graphql
type AuthMutations {
  login: AuthResult!  # ❌ Missing credentials argument
  logout: Boolean!
}

type UserQueries {
  profile: UserProfile!  # ❌ Missing id argument  
  list: [User!]!
}
```

### 2. ❌ **Context Resolution Returning Empty Object**
**Problem**: The GraphQL context was not being properly passed through to nested resolvers, always returning `{}` instead of the expected user data.

### 3. ❌ **Dependency Injection Failures**
**Problem**: Dynamically created resolver classes couldn't access injected services, causing runtime errors.

## Root Cause Analysis

The core issue was in the `createResolverClass` function in `/src/decorators/namespace-resolver.decorator.ts`. When creating dual resolvers (separate classes for mutations and queries), the system was:

1. **Not copying parameter decorator metadata** - `@Args` and `@Context` decorators weren't being transferred to new classes
2. **Losing service injection** - New classes couldn't access the original class's injected dependencies
3. **Breaking method context** - The `this` binding wasn't preserved properly

## Solutions Applied

### Fix 1: Parameter Decorator Metadata Copying

**File**: `/src/decorators/namespace-resolver.decorator.ts`

**Problem**: Parameter decorators like `@Args('credentials')` and `@Context()` store their metadata on the constructor with the method name as the property key. When creating new resolver classes, this metadata wasn't being copied.

**Solution**: Added proper metadata copying from original constructor to new constructor:

```typescript
// Copy parameter decorator metadata (Args, Context, etc.)
const paramMetadata = Reflect.getMetadata('__routeArguments__', originalTarget, methodMeta.propertyKey);
if (paramMetadata) {
  Reflect.defineMetadata('__routeArguments__', paramMetadata, ResolverClass, methodMeta.propertyKey);
}

// Re-apply parameter decorators to ensure they work with the new class
if (paramMetadata) {
  for (const [key, paramValue] of Object.entries(paramMetadata) as [string, any][]) {
    const [paramType, indexStr] = key.split(':');
    const index = parseInt(indexStr);
    
    switch (paramType) {
      case '1': // CONTEXT
        Context(paramValue.data)(ResolverClass.prototype, methodMeta.propertyKey, index);
        break;
      case '3': // ARGS
        Args(paramValue.data)(ResolverClass.prototype, methodMeta.propertyKey, index);
        break;
      case '2': // INFO
        Info()(ResolverClass.prototype, methodMeta.propertyKey, index);
        break;
      case '0': // ROOT
        Root()(ResolverClass.prototype, methodMeta.propertyKey, index);
        break;
    }
  }
}
```

### Fix 2: Class Extension for Dependency Injection

**Problem**: Creating completely new classes broke dependency injection because NestJS couldn't resolve the services.

**Solution**: Changed approach to extend the original class instead of creating a new one:

```typescript
// Before: Creating new class (broken DI)
const ResolverClass = class {} as any;

// After: Extending original class (preserves DI)
const ResolverClass = class extends originalTarget {} as any;
```

This preserves:
- Constructor dependencies (services)
- Method implementations
- Class metadata
- Proper `this` binding

### Fix 3: Enhanced Module Configuration

**File**: `/src/providers/namespace.module.ts`

**Problem**: The `NamespaceModule` didn't have access to the services that the resolvers needed.

**Solution**: Updated the module to accept additional providers:

```typescript
// Before: No way to provide services
static forRoot(): DynamicModule {
  // ...
}

// After: Accept additional providers
static forRoot(additionalProviders: Provider[] = []): DynamicModule {
  const allProviders: Provider[] = [
    ...additionalProviders, // User-provided services
    ...dynamicProviders,
    ...(dualResolvers as Provider[]),
    ...(originalResolvers as Provider[]),
  ];
  // ...
}
```

**Usage in AppModule**:
```typescript
NamespaceModule.forRoot([
  UserService,
  AuthService, 
  AdminService,
])
```

### Fix 4: Registry Enhancement

**Files**: `/src/core/types.ts`, `/src/core/registry.ts`

**Problem**: The registry system didn't track original resolver classes for dependency injection.

**Solution**: Added methods to register and retrieve original resolvers:

```typescript
// Interface additions
registerOriginalResolver(resolver: Function): void;
getOriginalResolvers(): readonly Function[];

// Implementation
registerOriginalResolver(resolver: Function): void {
  if (!this.originalResolvers.includes(resolver)) {
    this.originalResolvers.push(resolver);
  }
}
```

## Results After Fixes

### ✅ **Perfect Schema Generation**
```graphql
type AdminMutations {
  deleteUser(id: String!): AdminResult!
}

type AuthMutations {
  login(credentials: LoginInput!): AuthResult!
  logout: Boolean!
}

type UserMutations {
  createUser(input: CreateUserInput!): User!
}

type UserQueries {
  profile(id: String!): UserProfile!
  list: [User!]!
}

input LoginInput {
  email: String!
  password: String!
}

input CreateUserInput {
  email: String!
  name: String!
  bio: String
}
```

### ✅ **Working GraphQL Operations**

**Mutations with Arguments**:
```graphql
mutation {
  auth {
    login(credentials: { email: "john@example.com", password: "password" }) {
      token
      user { id email name bio }
      expiresAt
    }
  }
}
```

**Queries with Arguments**:
```graphql
query {
  user {
    profile(id: "1") {
      id userId bio avatar
    }
  }
}
```

### ✅ **Context Resolution**
```javascript
// Context is properly available in all resolvers
@NestedMutation(() => User)
async createUser(
  @Args('input') input: CreateUserInput,
  @Context() context: any,  // ✅ Now properly injected
): Promise<User> {
  const user = context.user; // ✅ Contains actual user data
  // ...
}
```

### ✅ **Service Injection**
```javascript
// Services are properly injected
@NamespaceResolver({ fieldName: 'user' })
export class UserResolver {
  constructor(
    private readonly userService: UserService // ✅ Properly injected
  ) {}
  // ...
}
```

## Testing Verified

All the following operations were tested and work correctly:

1. **✅ Authentication Mutations**: `login` with credentials argument
2. **✅ User Mutations**: `createUser` with input argument  
3. **✅ Admin Mutations**: `deleteUser` with id argument
4. **✅ User Queries**: `profile` with id argument, `list` without arguments
5. **✅ Context Access**: All resolvers can access `context.user`
6. **✅ Service Injection**: All resolvers can access their injected services

## Migration Guide

For users upgrading to the fixed version:

### 1. Update NamespaceModule Import
```typescript
// Before
NamespaceModule.forRoot()

// After - pass your services
NamespaceModule.forRoot([
  YourService1,
  YourService2,
  // ... other services your resolvers need
])
```

### 2. Ensure Explicit Return Types
```typescript
// Recommended: Always specify return types explicitly
@NestedMutation(() => AuthResult)
async login(@Args('credentials') credentials: LoginInput) {
  // ...
}

@NestedQuery(() => [User])
async list() {
  // ...
}
```

## Technical Details

### Parameter Decorator Metadata Storage

NestJS stores parameter decorator metadata using the key `'__routeArguments__'` on the constructor function with this structure:

```javascript
{
  "1:1": {           // Context decorator at parameter index 1
    "index": 1,
    "data": undefined,
    "pipes": []
  },
  "3:0": {           // Args decorator at parameter index 0  
    "index": 0,
    "data": "credentials", // Property name for Args('credentials')
    "pipes": []
  }
}
```

### GraphQL Parameter Types
- `0`: ROOT
- `1`: CONTEXT  
- `2`: INFO
- `3`: ARGS

The fix ensures this metadata is properly copied and re-applied to maintain GraphQL schema generation.

## Conclusion

These fixes resolve all critical issues with the `nestjs-gql-namespaces` package:

- ✅ Arguments are properly generated in the GraphQL schema
- ✅ Context is correctly resolved and available in all resolvers  
- ✅ Dependency injection works seamlessly with all services
- ✅ The package now fully supports complex nested GraphQL operations

The solution maintains backward compatibility while fixing the core functionality that was broken in the original implementation.