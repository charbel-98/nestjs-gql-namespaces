# NestJS GraphQL Namespaces Example

This is an example NestJS application demonstrating the usage of the `nestjs-gql-namespaces` package.

## Features Demonstrated

- **User Namespace**: Creating users and fetching user profiles
- **Auth Namespace**: Login, logout, and current user queries
- **Admin Namespace**: Administrative operations like deleting users

## Running the Example

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run start:dev
```

3. Open GraphQL Playground at: http://localhost:3000/graphql

## Example Queries

### User Namespace

Create a user:
```graphql
mutation {
  user {
    createUser(input: {
      email: "test@example.com"
      name: "Test User"
      bio: "A test user"
    }) {
      id
      email
      name
      bio
    }
  }
}
```

Get user profile:
```graphql
query {
  user {
    profile(id: "1") {
      id
      bio
      avatar
    }
  }
}
```

List all users:
```graphql
query {
  user {
    list {
      id
      email
      name
      bio
    }
  }
}
```

### Auth Namespace

Login:
```graphql
mutation {
  auth {
    login(credentials: {
      email: "john@example.com"
      password: "password"
    }) {
      token
      expiresAt
      user {
        id
        email
        name
      }
    }
  }
}
```

Get current user:
```graphql
query {
  auth {
    me {
      id
      email
      name
      bio
    }
  }
}
```

Logout:
```graphql
mutation {
  auth {
    logout
  }
}
```

### Admin Namespace

Get all users:
```graphql
query {
  admin {
    getAllUsers {
      id
      email
      name
      bio
    }
  }
}
```

Delete a user:
```graphql
mutation {
  admin {
    deleteUser(id: "2") {
      success
      message
      data
    }
  }
}
```

## Generated Schema

The package will generate the following GraphQL schema:

```graphql
type Mutation {
  user: UserMutations!
  auth: AuthMutations!
  admin: AdminMutations!
}

type Query {
  user: UserQueries!
  auth: AuthQueries!
  admin: AdminQueries!
}

type UserMutations {
  createUser(input: CreateUserInput!): User!
}

type UserQueries {
  profile(id: String!): UserProfile!
  list: [User!]!
}

type AuthMutations {
  login(credentials: LoginInput!): AuthResult!
  logout: Boolean!
}

type AuthQueries {
  me: User!
}

type AdminMutations {
  deleteUser(id: String!): AdminResult!
}

type AdminQueries {
  getAllUsers: [User!]!
}
```