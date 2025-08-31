import { Module } from '@nestjs/common';
import { registerNamespaceModule } from 'nestjs-gql-namespaces';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [AuthService, AuthResolver],
  exports: [AuthService, AuthResolver],
})
export class AuthModule {
  // Register this module immediately when the class is loaded
  static {
    registerNamespaceModule('auth', AuthModule, [AuthService, AuthResolver]);
  }
}