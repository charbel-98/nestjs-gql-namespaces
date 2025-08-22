/**
 * Example usage of nestjs-gql-namespaces
 * 
 * This file demonstrates how to use the package.
 * It's not included in the build but serves as documentation.
 */

import { Args } from '@nestjs/graphql';
import { NamespaceResolver, NestedMutation, NestedQuery } from './src/index';

// Define some example types
class User {
  id: string;
  name: string;
  email: string;
}

class CreateUserInput {
  name: string;
  email: string;
}

class UserProfile {
  bio: string;
  avatar: string;
}

// Example 1: Basic namespace resolver with mutations and queries
@NamespaceResolver({ fieldName: 'user' })
export class UserResolver {
  @NestedMutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    // Implementation would go here
    // This creates: mutation { user { createUser(input: ...) { id, name, email } } }
    return new User();
  }

  @NestedQuery(() => UserProfile)
  async profile(@Args('id') id: string): Promise<UserProfile> {
    // Implementation would go here  
    // This creates: query { user { profile(id: "...") { bio, avatar } } }
    return new UserProfile();
  }

  @NestedMutation()
  async updateEmail(@Args('email') email: string): Promise<boolean> {
    // Return type inferred from TypeScript
    // This creates: mutation { user { updateEmail(email: "...") } }
    return true;
  }
}

// Example 2: Nested namespace resolver
@NamespaceResolver({ 
  fieldName: 'settings',
  parentFieldName: 'user' 
})
export class UserSettingsResolver {
  @NestedMutation()
  async updatePreferences(@Args('prefs') prefs: any): Promise<boolean> {
    // This creates: mutation { user { settings { updatePreferences(prefs: ...) } } }
    return true;
  }

  @NestedQuery()
  async getPreferences(): Promise<any> {
    // This creates: query { user { settings { getPreferences } } }
    return {};
  }
}

// Example 3: Query-only namespace
@NamespaceResolver({ fieldName: 'analytics' })
export class AnalyticsResolver {
  @NestedQuery(() => Number)
  async totalUsers(): Promise<number> {
    // This creates: query { analytics { totalUsers } }
    return 1000;
  }

  @NestedQuery(() => [String])
  async popularPages(): Promise<string[]> {
    // This creates: query { analytics { popularPages } }
    return ['/home', '/about', '/products'];
  }
}

/**
 * The above resolvers would generate the following GraphQL schema:
 * 
 * type Mutation {
 *   user: UserMutations!
 * }
 * 
 * type Query {
 *   user: UserQueries!
 *   analytics: AnalyticsQueries!
 * }
 * 
 * type UserMutations {
 *   createUser(input: CreateUserInput!): User!
 *   updateEmail(email: String!): Boolean!
 *   settings: SettingsMutations!
 * }
 * 
 * type UserQueries {
 *   profile(id: String!): UserProfile!
 *   settings: SettingsQueries!
 * }
 * 
 * type SettingsMutations {
 *   updatePreferences(prefs: JSON): Boolean!
 * }
 * 
 * type SettingsQueries {
 *   getPreferences: JSON
 * }
 * 
 * type AnalyticsQueries {
 *   totalUsers: Float!
 *   popularPages: [String!]!
 * }
 */