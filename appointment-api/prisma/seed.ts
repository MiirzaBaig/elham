import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLOTS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    startsAt: new Date('2030-01-15T09:00:00.000Z'),
    endsAt: new Date('2030-01-15T09:30:00.000Z'),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    startsAt: new Date('2030-01-15T09:30:00.000Z'),
    endsAt: new Date('2030-01-15T10:00:00.000Z'),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    startsAt: new Date('2030-01-15T10:00:00.000Z'),
    endsAt: new Date('2030-01-15T10:30:00.000Z'),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    startsAt: new Date('2030-01-16T14:00:00.000Z'),
    endsAt: new Date('2030-01-16T14:45:00.000Z'),
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    startsAt: new Date('2030-01-17T11:00:00.000Z'),
    endsAt: new Date('2030-01-17T11:30:00.000Z'),
  },
] as const;

async function main() {
  for (const slot of SLOTS) {
    await prisma.slot.upsert({
      where: { id: slot.id },
      create: slot,
      update: {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
