import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeE2EApp, createE2EApp } from './e2e-setup';
import { UsersService } from '../src/modules/users/users.service';
import { UserRole } from '../src/modules/users/user-role.enum';

interface LoggedUser {
  token: string;
  id: string;
}

async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoggedUser> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);
  return { token: res.body.token, id: res.body.user.id };
}

async function provisionAdmin(app: INestApplication): Promise<LoggedUser> {
  const users = app.get(UsersService);
  await users.create({
    email: 'admin@test.local',
    password: 'admin-pass',
    role: UserRole.ADMIN,
  });
  return login(app, 'admin@test.local', 'admin-pass');
}

describe('Sections & Entries (e2e)', () => {
  let app: INestApplication;
  let dbPath: string;

  beforeAll(async () => {
    ({ app, dbPath } = await createE2EApp());
  });

  afterAll(async () => {
    await closeE2EApp(app, dbPath);
  });

  it('superadmin creates a section; admin cannot', async () => {
    const superadmin = await login(app, 'super@test.local', 'super-pass');
    const admin = await provisionAdmin(app);

    await request(app.getHttpServer())
      .post('/api/sections')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        slug: 'should-fail',
        name: { hy: 'a', ru: 'a', en: 'a' },
        layout: { blocks: [] },
      })
      .expect(403);

    const created = await request(app.getHttpServer())
      .post('/api/sections')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .send({
        slug: 'news',
        name: { hy: 'Նորություններ', ru: 'Новости', en: 'News' },
        layout: { blocks: [{ type: 'text' }] },
      })
      .expect(201);
    expect(created.body.slug).toBe('news');
    expect(created.body.isPublic).toBe(true);
  });

  it('rejects reserved slug with 409', async () => {
    const superadmin = await login(app, 'super@test.local', 'super-pass');
    const res = await request(app.getHttpServer())
      .post('/api/sections')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .send({
        slug: 'users',
        name: { hy: 'x', ru: 'x', en: 'x' },
        layout: {},
      })
      .expect(409);
    expect(res.body).toEqual({ errors: { slug: 'reserved' } });
  });

  it('admin creates a draft entry and public GET hides it', async () => {
    const admin = await login(app, 'admin@test.local', 'admin-pass');

    const created = await request(app.getHttpServer())
      .post('/api/news')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        data: { title: { hy: 'Բարև', ru: 'Привет', en: 'Hello' } },
      })
      .expect(201);
    expect(created.body.status).toBe('draft');
    expect(created.body.publishedAt).toBeNull();

    const publicList = await request(app.getHttpServer())
      .get('/api/news')
      .expect(200);
    expect(publicList.body).toEqual([]);

    const adminList = await request(app.getHttpServer())
      .get('/api/news?status=draft')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(adminList.body).toHaveLength(1);
    expect(adminList.body[0].id).toBe(created.body.id);
  });

  it('publish endpoint moves entry to published and public GET returns it', async () => {
    const admin = await login(app, 'admin@test.local', 'admin-pass');
    const draftList = await request(app.getHttpServer())
      .get('/api/news?status=draft')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    const draftId = draftList.body[0].id as string;

    const published = await request(app.getHttpServer())
      .post(`/api/news/${draftId}/publish`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(published.body.status).toBe('published');
    expect(published.body.publishedAt).not.toBeNull();

    const publicList = await request(app.getHttpServer())
      .get('/api/news')
      .expect(200);
    expect(publicList.body).toHaveLength(1);
    expect(publicList.body[0].id).toBe(draftId);
  });

  it('?lang=hy returns only the Armenian locale for multilingual fields', async () => {
    const publicList = await request(app.getHttpServer())
      .get('/api/news?lang=hy')
      .expect(200);
    expect(publicList.body[0].data).toEqual({ title: 'Բարև' });
  });

  it('private section requires JWT for GET', async () => {
    const superadmin = await login(app, 'super@test.local', 'super-pass');
    await request(app.getHttpServer())
      .post('/api/sections')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .send({
        slug: 'private-news',
        name: { hy: 'x', ru: 'x', en: 'x' },
        layout: {},
        isPublic: false,
      })
      .expect(201);

    await request(app.getHttpServer()).get('/api/private-news').expect(401);

    const withToken = await request(app.getHttpServer())
      .get('/api/private-news')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .expect(200);
    expect(withToken.body).toEqual([]);
  });

  it('static endpoints are NOT shadowed by the universal dispatcher', async () => {
    const superadmin = await login(app, 'super@test.local', 'super-pass');
    await request(app.getHttpServer())
      .get('/api/sections')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .expect(200);
  });

  it('unknown slug returns 404', async () => {
    await request(app.getHttpServer())
      .get('/api/totally-not-a-section')
      .expect(404);
  });

  it('invalid lang code returns 400', async () => {
    await request(app.getHttpServer())
      .get('/api/news?lang=de')
      .expect(400);
  });

  it('admin sees own draft entries via /api/entries', async () => {
    const admin = await login(app, 'admin@test.local', 'admin-pass');
    const list = await request(app.getHttpServer())
      .get('/api/entries')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);
  });

  it('section delete cascades to entries', async () => {
    const superadmin = await login(app, 'super@test.local', 'super-pass');
    const sectionList = await request(app.getHttpServer())
      .get('/api/sections')
      .set('Authorization', `Bearer ${superadmin.token}`)
      .expect(200);
    const news = sectionList.body.find((s: { slug: string }) => s.slug === 'news');
    expect(news).toBeDefined();

    await request(app.getHttpServer())
      .delete(`/api/sections/${news.id}`)
      .set('Authorization', `Bearer ${superadmin.token}`)
      .expect(204);

    await request(app.getHttpServer()).get('/api/news').expect(404);
  });
});
