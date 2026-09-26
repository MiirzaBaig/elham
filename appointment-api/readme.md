<div align="center">

<img src="assets/logo.svg" width="56" height="56" alt="logo" />

# appointment booking api

nestjs · postgresql · prisma · socket.io · swagger

[mirza baig](https://www.meetmirza.com/) · [meetmirza.com](https://www.meetmirza.com/)

</div>

recruitment exercise: three rest endpoints, one active booking per slot, socket.io after commit, openapi docs, postgres e2e tests. no authentication. optional demo in `demo-ui/` (excluded from submission zip).

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="node 20+" />
  <img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="nestjs" />
  <img src="https://img.shields.io/badge/postgres-14%2B-4169E1?logo=postgresql&logoColor=white" alt="postgres" />
  <img src="https://img.shields.io/badge/tests-12%20e2e-1B8354" alt="tests" />
</p>

---

## reviewer quick start

**prerequisites:** node.js 20+, postgresql 14+, npm.

```bash
cd appointment-api
npm install
npm install-scripts approve prisma @prisma/client @prisma/engines   # if npm blocks prisma scripts

cp .env.example .env
cp .env.example .env.test
```

edit both files — use **two different database names** (example: `appointments` and `appointments_test`).

```bash
createdb appointments 2>/dev/null || true
createdb appointments_test 2>/dev/null || true

npm run test:ci
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

| resource | url |
|----------|-----|
| swagger ui | http://localhost:3000/docs |
| openapi json | http://localhost:3000/openapi.json |
| list slots | http://localhost:3000/slots |

**submission zip:** `npm run zip` → `appointment-booking-api.zip`

---

## environment

| variable | description |
|----------|-------------|
| `DATABASE_URL` | postgresql connection string |
| `PORT` | http port (default `3000`) |

placeholders only in `.env.example`. do not commit `.env` or `.env.test`.

| file | used by |
|------|---------|
| `.env` | dev api (`npm run start:dev`) |
| `.env.test` | jest e2e (`npm test`, `npm run test:ci`) |

---

## database

```bash
npx prisma migrate deploy
npm run db:seed
```

seed includes fixed uuid slots, e.g. `11111111-1111-4111-8111-111111111111` (2030-01-15 09:00–09:30 utc).

dev reset (local only): `npm run db:reset`

---

## run the api

```bash
npm run start:dev      # watch mode
npm run build && npm run start:prod
```

| script | purpose |
|--------|---------|
| `npm run db:migrate` | apply migrations |
| `npm run db:seed` | seed slots |
| `npm run typecheck` | typescript check |

---

## tests

uses **real postgresql** — no mocked persistence. concurrent test uses parallel http requests, not sequential simulation.

**test database:** `.env.test` must point at a **separate** database. the suite deletes all **bookings** before/after cases; seeded **slots** remain.

```bash
npm run test:ci     # recommended: migrate + seed test db + full suite
npm test            # when test db already migrated and seeded
```

**three required scenarios (spec):**

1. successful booking → **201**, slot removed from `GET /slots`
2. two overlapping `POST /bookings` for one slot → one **201**, one **409**, exactly one active row in db
3. cancel → **200**, slot available again, new booking **201**

additional e2e: error codes, idempotent cancel, socket.io emit / no emit on **409**.

---

## api contract

json bodies · uuid string ids · iso 8601 utc timestamps · no auth · no pagination.

### `GET /slots`

available slots only (no active booking). sort: `startsAt` asc, then `id` asc.

### `POST /bookings`

body: `slotId`, `customerName`, `customerEmail` — trimmed before validation/storage.

| status | `error.code` |
|--------|----------------|
| 201 | — |
| 400 | `VALIDATION_ERROR` |
| 404 | `SLOT_NOT_FOUND` |
| 409 | `SLOT_UNAVAILABLE` |
| 500 | `INTERNAL_ERROR` |

### `DELETE /bookings/{bookingId}`

| status | `error.code` |
|--------|----------------|
| 200 | cancelled (repeat → same 200, no side effects) |
| 400 | `VALIDATION_ERROR` |
| 404 | `BOOKING_NOT_FOUND` |
| 500 | `INTERNAL_ERROR` |

```json
{ "error": { "code": "SLOT_UNAVAILABLE", "message": "..." } }
```

details and examples: **swagger** at `/docs`.

---

## socket.io (no frontend required)

same server · namespace `/` · path `/socket.io` · no auth.

after successful db commit:

| event | payload |
|-------|---------|
| `slot.booked` | `{ slotId, bookingId, available: false }` |
| `slot.released` | `{ slotId, bookingId, available: true }` |

no customer data. no events on 4xx, **409**, or repeated cancellation.

**terminal 1 — api**

```bash
npm run start:dev
```

**terminal 2 — listener**

```bash
npm run socket:listen
```

**terminal 3 — book**

```bash
curl -s -X POST http://localhost:3000/bookings \
  -H 'Content-Type: application/json' \
  -d '{"slotId":"11111111-1111-4111-8111-111111111111","customerName":"Alex Morgan","customerEmail":"alex@example.com"}'
```

expect `slot.booked` on the listener. cancel with `DELETE /bookings/{bookingId}` to see `slot.released`.

socket.io is documented here, not as http operations in openapi.

---

## conflict prevention

at most one **active** booking per slot — enforced in postgres:

```sql
create unique index bookings_one_active_per_slot
  on bookings (slot_id) where status = 'active';
```

concurrent valid posts: one insert wins; the other hits prisma `P2002` → **409** `SLOT_UNAVAILABLE`. cancelled rows are excluded from the index.

---

## key decisions

| topic | choice |
|-------|--------|
| availability | derived — slot listed when no `status = active` booking for that slot |
| cancellation | soft delete (`cancelled` + `cancelled_at`); socket only on first active → cancelled |
| concurrency | partial unique index (not app-only check-then-insert) |
| errors | global filter; no stack traces in responses |
| ids / times | uuid strings; api timestamps as iso 8601 utc |
| openapi | swagger ui `/docs`, json at `/openapi.json` |

---

## optional demo ui

not graded · not in zip · lives in `demo-ui/`.

**api must be running on port 3000 first.**

```bash
npm run demo:install    # once
npm run demo:dev        # http://localhost:5173 (vite proxies to api)

npm run demo:build      # static files → http://localhost:3000/demo/ when api runs
```

---

## project layout

```
appointment-api/
├── readme.md
├── assets/logo.svg
├── prisma/          schema, migrations, seed
├── src/             slots, bookings, events (socket.io)
├── test/e2e/        postgres integration tests
├── demo-ui/         optional (excluded from zip)
└── scripts/         socket-listen.ts, make-zip.sh
```

---

## zip submission

```bash
chmod +x scripts/make-zip.sh
npm run zip
```

**included:** source, `package.json`, lockfile, prisma schema + migrations + seed, tests, readme.md, `.env.example`, logo.

**excluded:** `node_modules`, `dist`, `demo-ui/`, `.env*`, secrets, `*.zip`.

---

## links

<p align="center">
  <a href="https://www.meetmirza.com/" title="mirza baig — portfolio">
    <img src="https://img.shields.io/badge/author-mirza_baig-0B3D2E?style=for-the-badge&logo=vercel&logoColor=F7F5EF" alt="author: mirza baig" />
  </a>
  <a href="../readme.md" title="repository overview">
    <img src="https://img.shields.io/badge/root-readme-4169E1?style=for-the-badge&logo=gitbook&logoColor=white" alt="root readme" />
  </a>
  <a href="http://localhost:3000/docs" title="swagger ui (local)">
    <img src="https://img.shields.io/badge/swagger-openapi-E0234E?style=for-the-badge&logo=swagger&logoColor=white" alt="swagger" />
  </a>
</p>

---

## future improvements

structured request logging, health endpoint for ops, rate limiting at the proxy.

## unfinished

none against the written spec.

## actual time spent

_~4–5 hours — update this line before your final submission._

## ai disclosure

cursor assisted with boilerplate and tests. i verified behavior against the brief and ran `npm run test:ci` locally.
