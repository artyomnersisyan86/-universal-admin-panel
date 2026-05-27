import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly cfg: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.cfg.get<string>('SEED_SUPERADMIN_EMAIL');
    const password = this.cfg.get<string>('SEED_SUPERADMIN_PASSWORD');
    if (!email || !password) return;

    const existing = await this.users.findByEmail(email).catch(() => null);
    if (existing) return;

    await this.users.create({ email, password, role: UserRole.SUPERADMIN });
    this.logger.log(`Seeded superadmin: ${email}`);
  }
}
