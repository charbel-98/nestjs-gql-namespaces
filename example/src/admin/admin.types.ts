import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AdminResult {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  data?: string;
}