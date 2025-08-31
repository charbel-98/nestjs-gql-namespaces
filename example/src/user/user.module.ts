import { Module } from '@nestjs/common';
import { registerNamespaceModule } from 'nestjs-gql-namespaces';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';

@Module({
  providers: [UserService, UserResolver],
  exports: [UserService, UserResolver],
})
export class UserModule {
  // Register this module immediately when the class is loaded
  static {
    registerNamespaceModule('user', UserModule, [UserService, UserResolver]);
  }
}