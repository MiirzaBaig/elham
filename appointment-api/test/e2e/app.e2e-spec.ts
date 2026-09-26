import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

const SLOT_A = '11111111-1111-4111-8111-111111111111';
const SLOT_B = '22222222-2222-4222-8222-222222222222';
const MISSING_SLOT = '99999999-9999-4999-8999-999999999999';
const MISSING_BOOKING = '88888888-8888-4888-8888-888888888888';

describe('Appointment Booking API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await app.listen(0);

    prisma = app.get(PrismaService);
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  it('successful booking returns 201 and removes slot from GET /slots', async () => {
    const before = await request(app.getHttpServer()).get('/slots').expect(200);
    expect(before.body.slots.some((s: { id: string }) => s.id === SLOT_A)).toBe(
      true,
    );

    const created = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId: SLOT_A,
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
      })
      .expect(201);

    expect(created.body.booking).toMatchObject({
      slotId: SLOT_A,
      customerName: 'Alex Morgan',
      customerEmail: 'alex@example.com',
      status: 'active',
    });

    const after = await request(app.getHttpServer()).get('/slots').expect(200);
    expect(after.body.slots.some((s: { id: string }) => s.id === SLOT_A)).toBe(
      false,
    );

    const activeCount = await prisma.booking.count({
      where: { slotId: SLOT_A, status: 'active' },
    });
    expect(activeCount).toBe(1);
  });

  it('two concurrent bookings for one slot yield one 201 and one 409', async () => {
    const server = app.getHttpServer();
    const payloadA = {
      slotId: SLOT_A,
      customerName: 'Alex Morgan',
      customerEmail: 'alex@example.com',
    };
    const payloadB = {
      slotId: SLOT_A,
      customerName: 'Sam Rivera',
      customerEmail: 'sam@example.com',
    };

    const [resA, resB] = await Promise.all([
      request(server).post('/bookings').send(payloadA),
      request(server).post('/bookings').send(payloadB),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const conflict = resA.status === 409 ? resA : resB;
    expect(conflict.body.error.code).toBe('SLOT_UNAVAILABLE');

    const activeCount = await prisma.booking.count({
      where: { slotId: SLOT_A, status: 'active' },
    });
    expect(activeCount).toBe(1);
  });

  it('cancellation restores availability and allows a new booking', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId: SLOT_B,
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
      })
      .expect(201);

    const bookingId = createRes.body.booking.id as string;

    await request(app.getHttpServer())
      .delete(`/bookings/${bookingId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.booking.status).toBe('cancelled');
      });

    const slotsAfterCancel = await request(app.getHttpServer())
      .get('/slots')
      .expect(200);
    expect(
      slotsAfterCancel.body.slots.some((s: { id: string }) => s.id === SLOT_B),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId: SLOT_B,
        customerName: 'Jordan Lee',
        customerEmail: 'jordan@example.com',
      })
      .expect(201);

    const activeCount = await prisma.booking.count({
      where: { slotId: SLOT_B, status: 'active' },
    });
    expect(activeCount).toBe(1);
  });

  it('repeated cancellation is idempotent (200, status cancelled)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId: SLOT_A,
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
      })
      .expect(201);

    const bookingId = createRes.body.booking.id as string;

    const first = await request(app.getHttpServer())
      .delete(`/bookings/${bookingId}`)
      .expect(200);
    expect(first.body.booking.status).toBe('cancelled');

    const second = await request(app.getHttpServer())
      .delete(`/bookings/${bookingId}`)
      .expect(200);
    expect(second.body.booking).toEqual(first.body.booking);

    const cancelledRows = await prisma.booking.count({
      where: { id: bookingId, status: 'cancelled' },
    });
    expect(cancelledRows).toBe(1);
  });

  describe('error contract', () => {
    it('POST with invalid email returns 400 VALIDATION_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_A,
          customerName: 'Alex Morgan',
          customerEmail: 'not-an-email',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBeTruthy();
    });

    it('POST for unknown slot returns 404 SLOT_NOT_FOUND', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: MISSING_SLOT,
          customerName: 'Alex Morgan',
          customerEmail: 'alex@example.com',
        })
        .expect(404);

      expect(res.body.error.code).toBe('SLOT_NOT_FOUND');
    });

    it('sequential second POST returns 409 SLOT_UNAVAILABLE', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_A,
          customerName: 'Alex Morgan',
          customerEmail: 'alex@example.com',
        })
        .expect(201);

      const conflict = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_A,
          customerName: 'Sam Rivera',
          customerEmail: 'sam@example.com',
        })
        .expect(409);

      expect(conflict.body.error.code).toBe('SLOT_UNAVAILABLE');
    });

    it('DELETE with invalid UUID returns 400 VALIDATION_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .delete('/bookings/not-a-uuid')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('DELETE for unknown booking returns 404 BOOKING_NOT_FOUND', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/bookings/${MISSING_BOOKING}`)
        .expect(404);

      expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
    });
  });

  describe('Socket.IO', () => {
    function connectClient(): Promise<{ socket: Socket; baseUrl: string }> {
      const addr = app.getHttpServer().address();
      if (!addr || typeof addr === 'string') {
        throw new Error('Expected server to listen on a TCP port');
      }
      const baseUrl = `http://127.0.0.1:${addr.port}`;
      return new Promise((resolve, reject) => {
        const socket = io(baseUrl, {
          path: '/socket.io',
          transports: ['websocket'],
        });
        socket.on('connect', () => resolve({ socket, baseUrl }));
        socket.on('connect_error', reject);
      });
    }

    it('emits slot.booked after successful POST', async () => {
      const { socket } = await connectClient();
      const eventPromise = new Promise<{ slotId: string; available: boolean }>(
        (resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('slot.booked timeout')),
            8000,
          );
          socket.once('slot.booked', (payload) => {
            clearTimeout(timer);
            resolve(payload);
          });
        },
      );

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_A,
          customerName: 'Alex Morgan',
          customerEmail: 'alex@example.com',
        })
        .expect(201);

      const payload = await eventPromise;
      expect(payload.slotId).toBe(SLOT_A);
      expect(payload.available).toBe(false);
      socket.close();
    });

    it('emits slot.released after DELETE', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_B,
          customerName: 'Alex Morgan',
          customerEmail: 'alex@example.com',
        })
        .expect(201);
      const bookingId = createRes.body.booking.id as string;

      const { socket } = await connectClient();
      const eventPromise = new Promise<{ slotId: string; available: boolean }>(
        (resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('slot.released timeout')),
            8000,
          );
          socket.once('slot.released', (payload) => {
            clearTimeout(timer);
            resolve(payload);
          });
        },
      );

      await request(app.getHttpServer())
        .delete(`/bookings/${bookingId}`)
        .expect(200);

      const payload = await eventPromise;
      expect(payload.slotId).toBe(SLOT_B);
      expect(payload.available).toBe(true);
      socket.close();
    });

    it('does not emit on 409 conflict', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_A,
          customerName: 'Alex Morgan',
          customerEmail: 'alex@example.com',
        })
        .expect(201);

      const { socket } = await connectClient();
      let bookedCount = 0;
      socket.on('slot.booked', () => {
        bookedCount += 1;
      });

      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: SLOT_A,
          customerName: 'Sam Rivera',
          customerEmail: 'sam@example.com',
        })
        .expect(409);

      await new Promise((r) => setTimeout(r, 400));
      expect(bookedCount).toBe(0);
      socket.close();
    });
  });
});
