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

/**
 * End-to-end happy path that mirrors the spec acceptance criteria:
 * create section → create draft entry → read/update/publish/delete it
 * through the universal `/api/:section[/:id]` dispatcher.
 */
describe('Entry lifecycle (e2e)', () => {
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

    await request(app.getHttpServer())
      .post('/api/sections')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        slug: 'news',
        name: { hy: 'Նորություններ', ru: 'Новости', en: 'News' },
        layout: { blocks: [{ type: 'heading' }, { type: 'text' }] },
      })
      .expect(201);
  });

  afterAll(async () => {
    await closeE2EApp(app, dbPath);
  });

  let entryId: string;

  it('admin creates a draft entry', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        data: {
          title: { hy: 'Վերնագիր', ru: 'Заголовок', en: 'Title' },
          body: 'plain text',
        },
      })
      .expect(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.sectionSlug).toBe('news');
    entryId = res.body.id;
  });

  it('admin reads its own draft detail; public 404s it', async () => {
    const adminView = await request(app.getHttpServer())
      .get(`/api/news/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminView.body.id).toBe(entryId);
    expect((adminView.body.data as { body: string }).body).toBe('plain text');

    await request(app.getHttpServer()).get(`/api/news/${entryId}`).expect(404);
  });

  it('rejects a non-UUID entry id with 400', async () => {
    await request(app.getHttpServer())
      .get('/api/news/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('PATCH updates entry data without publishing it', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/news/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        data: {
          title: { hy: 'Նոր', ru: 'Новый', en: 'New' },
          body: 'edited',
        },
      })
      .expect(200);
    expect(res.body.status).toBe('draft');
    expect((res.body.data as { body: string }).body).toBe('edited');
  });

  it('publish moves the entry to published and public detail returns it', async () => {
    const published = await request(app.getHttpServer())
      .post(`/api/news/${entryId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(published.body.status).toBe('published');
    expect(published.body.publishedAt).not.toBeNull();

    const publicView = await request(app.getHttpServer())
      .get(`/api/news/${entryId}`)
      .expect(200);
    expect(publicView.body.id).toBe(entryId);
  });

  it('?lang=hy collapses multilingual fields on the detail view', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/news/${entryId}?lang=hy`)
      .expect(200);
    expect((res.body.data as { title: string }).title).toBe('Նոր');
  });

  it('anonymous users cannot create, update, publish or delete', async () => {
    await request(app.getHttpServer())
      .post('/api/news')
      .send({ data: {} })
      .expect(401);
    await request(app.getHttpServer())
      .patch(`/api/news/${entryId}`)
      .send({ data: {} })
      .expect(401);
    await request(app.getHttpServer())
      .delete(`/api/news/${entryId}`)
      .expect(401);
  });

  it('DELETE removes the entry; subsequent reads 404', async () => {
    await request(app.getHttpServer())
      .delete(`/api/news/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/news/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
