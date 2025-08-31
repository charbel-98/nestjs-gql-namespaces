import { Module } from '@nestjs/common';
import { registerNamespaceModule } from 'nestjs-gql-namespaces';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';

@Module({
  providers: [AdminService, AdminResolver],
  exports: [AdminService, AdminResolver],
})
export class AdminModule {
  // Register this module immediately when the class is loaded
  static {
    registerNamespaceModule('admin', AdminModule, [AdminService, AdminResolver]);
  }
}