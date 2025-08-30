import { ObjectType, Field, InputType, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  bio?: string;
}

@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatar?: string;
}

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  bio?: string;
}