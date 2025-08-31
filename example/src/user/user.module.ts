import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';

@Module({
  providers: [UserService, UserResolver],
  exports: [UserService, UserResolver],
})
export class UserModule {
  // No manual registration needed - works automatically!
}