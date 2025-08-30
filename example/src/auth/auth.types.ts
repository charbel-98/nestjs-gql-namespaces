import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { User } from '../user/user.types';

@ObjectType()
export class AuthResult {
  @Field()
  token: string;

  @Field(() => User)
  user: User;

  @Field()
  expiresAt: string;
}

@InputType()
export class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}