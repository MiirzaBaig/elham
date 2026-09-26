# appointment booking api

![logo](assets/logo.svg)

nestjs · postgresql · prisma · socket.io · swagger

**mirza baig** — [meetmirza.com](https://www.meetmirza.com/)

recruitment exercise: three rest endpoints, one active booking per slot, socket events after commit, postgres e2e tests. no auth. optional demo in `demo-ui/` (excluded from zip).

---

## quick start (reviewer)

needs: node 20+, postgres 14+, npm.

```bash
npm install
# if prisma scripts blocked:
npm install-scripts approve prisma @prisma/client @prisma/engines

cp .env.example .env
cp .env.example .env.test
```

use two databases in those files (e.g. `appointments` and `appointments_test`).

```bash
createdb appointments 2>/dev/null || true
createdb appointments_test 2>/dev/null || true

npm run test:ci
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

| url | purpose |
|-----|---------|
| http://localhost:3000/docs | swagger |
| http://localhost:3000/openapi.json | openapi |
| http://localhost:3000/slots | list slots |

zip: `npm run zip` → `appointment-booking-api.zip`

---

## env

| variable | use |
|----------|-----|
| `DATABASE_URL` | postgres connection string |
| `PORT` | default 3000 |

`.env` → dev api. `.env.test` → jest (separate db; tests delete bookings).

---

## database

```bash
npx prisma migrate deploy
npm run db:seed
```

seed example slot: `11111111-1111-4111-8111-111111111111` (2030-01-15 09:00–09:30 utc).

---

## scripts

| command | |
|---------|--|
| `npm run start:dev` | api watch mode |
| `npm test` | e2e (test db seeded/migrated) |
| `npm run test:ci` | migrate + seed test db + e2e |
| `npm run socket:listen` | print socket events |
| `npm run demo:dev` | demo ui on :5173 |
| `npm run demo:build` | static demo → `/demo` on api |

---

## tests

real postgres, no mocked booking store. 12 cases including parallel post (201 + 409), cancel flow, error codes, socket emit / no emit on 409.

```bash
npm run test:ci
```

---

## api

json bodies. uuid ids. iso 8601 utc timestamps. no authentication.

### get /slots

available slots only; sort `startsAt`, then `id`.

### post /bookings

body: `slotId`, `customerName`, `customerEmail` (trimmed before validate/save).

| status | code |
|--------|------|
| 201 | created |
| 400 | `VALIDATION_ERROR` |
| 404 | `SLOT_NOT_FOUND` |
| 409 | `SLOT_UNAVAILABLE` |
| 500 | `INTERNAL_ERROR` |

### delete /bookings/{bookingId}

200 + `status: cancelled`. repeat delete → same 200, no socket event.

errors: `{ "error": { "code", "message" } }`

---

## socket.io

path `/socket.io`, namespace `/`.

after successful commit:

- `slot.booked` → `{ slotId, bookingId, available: false }`
- `slot.released` → `{ slotId, bookingId, available: true }`

no customer fields. no events on 4xx or repeat cancel.

```bash
npm run socket:listen
```

---

## conflict prevention

partial unique index:

```sql
create unique index bookings_one_active_per_slot
  on bookings (slot_id) where status = 'active';
```

concurrent inserts: one wins, other → prisma `P2002` → 409.

---

## optional demo ui

folder: `demo-ui/` (not in submission zip).

```bash
npm run demo:install   # once
npm run demo:dev       # http://localhost:5173
# or
npm run demo:build && npm run start:dev   # http://localhost:3000/demo/
```

---

## layout

```
src/           nest modules (slots, bookings, events)
prisma/        schema, migrations, seed
test/e2e/      integration tests
demo-ui/       optional front-end
scripts/       socket-listen, make-zip
assets/        logo
```

---

## zip contents

included: source, lockfile, prisma, tests, readme.md, `.env.example`.

excluded: `node_modules`, `dist`, `demo-ui/`, `.env*`, secrets.

---

## time spent

update before submit: _~4–5h (api, tests, swagger, demo, docs)._

## unfinished

_none vs spec._

## ai disclosure

cursor assisted with boilerplate and tests. i reviewed behavior against the brief and ran `npm run test:ci` locally.

author: [mirza baig](https://www.meetmirza.com/)
