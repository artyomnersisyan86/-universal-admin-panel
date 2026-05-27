import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user-role.enum';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  toPublic(u: User): PublicUser {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException({ errors: { id: 'notFound' } });
    return u;
  }

  async list(page = 1, limit = 25): Promise<{ items: PublicUser[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: items.map((u) => this.toPublic(u)), total, page, limit };
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const exists = await this.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException({ errors: { email: 'alreadyExists' } });
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const u = this.repo.create({
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.USER,
    });
    return this.toPublic(await this.repo.save(u));
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const u = await this.findById(id);
    if (dto.email && dto.email !== u.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists && exists.id !== id) {
        throw new ConflictException({ errors: { email: 'alreadyExists' } });
      }
      u.email = dto.email;
    }
    if (dto.password) u.passwordHash = await bcrypt.hash(dto.password, 10);
    if (dto.role) u.role = dto.role;
    return this.toPublic(await this.repo.save(u));
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.delete({ id });
  }
}
