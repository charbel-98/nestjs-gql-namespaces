import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';

@Module({
  providers: [AdminService, AdminResolver],
  exports: [AdminService, AdminResolver],
})
export class AdminModule {
  // No manual registration needed - works automatically!
}