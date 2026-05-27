import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeE2EApp, createE2EApp } from './e2e-setup';
import { UsersService } from '../src/modules/users/users.service';
import { UserRole } from '../src/modules/users/user-role.enum';

async function login(app: INestApplication, email: string, password: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);
  return res.body.token as string;
}

describe('Layout Templates (e2e)', () => {
  let app: INestApplication;
  let dbPath: string;
  let superToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ({ app, dbPath } = await createE2EApp());
    superToken = await login(app, 'super@test.local', 'super-pass');

    const users = app.get(UsersService);
    await users.create({
      email: 'admin@test.local',
      password: 'admin-pass',
      role: UserRole.ADMIN,
    });
    adminToken = await login(app, 'admin@test.local', 'admin-pass');
  });

  afterAll(async () => {
    await closeE2EApp(app, dbPath);
  });

  it('admin cannot manage templates (superadmin-only)', async () => {
    await request(app.getHttpServer())
      .post('/api/layout-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'x', layout: {} })
      .expect(403);
  });

  it('superadmin creates a template', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/layout-templates')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'Blog post',
        description: 'h1 + paragraph + image',
        layout: { blocks: [{ type: 'heading' }, { type: 'image' }] },
      })
      .expect(201);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.name).toBe('Blog post');
    expect((res.body.layout as { blocks: unknown[] }).blocks).toHaveLength(2);
  });

  it('createFromSection snapshots a section\'s layout', async () => {
    const section = await request(app.getHttpServer())
      .post('/api/sections')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        slug: 'products',
        name: { hy: 'a', ru: 'a', en: 'a' },
        layout: { blocks: [{ type: 'price' }] },
      })
      .expect(201);

    const tpl = await request(app.getHttpServer())
      .post('/api/layout-templates/from-section')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        sectionId: section.body.id,
        name: 'Product layout',
      })
      .expect(201);
    expect(tpl.body.layout).toEqual({ blocks: [{ type: 'price' }] });
  });
});
