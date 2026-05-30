import * as path from 'node:path';
import * as fs from 'node:fs';
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

// Smallest valid PNG (1x1 transparent pixel).
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Uploads (e2e)', () => {
  let app: INestApplication;
  let dbPath: string;
  let adminToken: string;
  let uploadedFilename: string | undefined;

  beforeAll(async () => {
    ({ app, dbPath } = await createE2EApp());

    const users = app.get(UsersService);
    await users.create({
      email: 'admin@test.local',
      password: 'admin-pass',
      role: UserRole.ADMIN,
    });
    adminToken = await login(app, 'admin@test.local', 'admin-pass');
  });

  afterAll(async () => {
    if (uploadedFilename) {
      const uploadDir =
        process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads');
      try {
        fs.unlinkSync(path.join(uploadDir, uploadedFilename));
      } catch {
        /* best-effort cleanup */
      }
    }
    await closeE2EApp(app, dbPath);
  });

  it('rejects anonymous uploads with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/uploads')
      .attach('file', PNG_1X1, 'pixel.png')
      .expect(401);
  });

  it('admin uploads a file and gets a public url back', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', PNG_1X1, 'pixel.png')
      .expect(201);

    expect(res.body.url).toMatch(/^\/api\/uploads\//);
    expect(res.body.filename).toMatch(/\.png$/);
    expect(res.body.size).toBe(PNG_1X1.length);
    uploadedFilename = res.body.filename as string;
  });

  it('serves the uploaded file back', async () => {
    expect(uploadedFilename).toBeDefined();
    const res = await request(app.getHttpServer())
      .get(`/api/uploads/${uploadedFilename}`)
      .expect(200);
    expect(res.body.length ?? res.text.length).toBeGreaterThan(0);
  });

  it('returns 400 when no file is attached', async () => {
    await request(app.getHttpServer())
      .post('/api/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });
});
