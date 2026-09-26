<div align="center">

<img src="assets/logo.svg" width="56" height="56" alt="logo" />

# appointment booking api

nestjs · postgresql · prisma · socket.io · swagger

[mirza baig](https://www.meetmirza.com/) · [meetmirza.com](https://www.meetmirza.com/)

</div>

recruitment exercise — fixed slots, one active booking per slot, socket events after commit, postgres e2e tests. no auth. demo in `demo-ui/` (excluded from zip).

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="node 20+" />
  <img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="nestjs" />
  <img src="https://img.shields.io/badge/postgres-14%2B-4169E1?logo=postgresql&logoColor=white" alt="postgres" />
  <img src="https://img.shields.io/badge/tests-12%20e2e-1B8354" alt="tests" />
</p>

---

## quick start

**needs:** node 20+, postgres 14+, npm

```bash
cd appointment-api
npm install
npm install-scripts approve prisma @prisma/client @prisma/engines  # if needed

cp .env.example .env && cp .env.example .env.test
# two db names: appointments + appointments_test

createdb appointments 2>/dev/null || true
createdb appointments_test 2>/dev/null || true

npm run test:ci
npx prisma migrate deploy && npm run db:seed
npm run start:dev
```

| link | |
|------|--|
| [swagger](http://localhost:3000/docs) | try the api |
| [openapi.json](http://localhost:3000/openapi.json) | spec |
| `/slots` | list available slots |

submission: `npm run zip`

---

<details>
<summary><strong>api summary</strong></summary>

| method | path | notes |
|--------|------|--------|
| get | `/slots` | available only, sorted |
| post | `/bookings` | 201 / 400 / 404 / 409 |
| delete | `/bookings/:id` | cancel, idempotent 200 |

errors: `{ "error": { "code", "message" } }`

</details>

<details>
<summary><strong>socket.io</strong></summary>

path `/socket.io` · namespace `/`

- `slot.booked` / `slot.released` after commit only  
- no pii, no events on 4xx or repeat cancel  

`npm run socket:listen`

</details>

<details>
<summary><strong>conflict prevention</strong></summary>

```sql
create unique index bookings_one_active_per_slot
  on bookings (slot_id) where status = 'active';
```

parallel posts → one 201, one 409.

</details>

<details>
<summary><strong>demo ui (optional)</strong></summary>

```bash
npm run demo:install && npm run demo:dev    # :5173
npm run demo:build                          # then :3000/demo/
```

</details>

<details>
<summary><strong>env & scripts</strong></summary>

| variable | use |
|----------|-----|
| `DATABASE_URL` | postgres url |
| `PORT` | default 3000 |

`.env` = dev · `.env.test` = jest (separate db)

| script | |
|--------|--|
| `npm test` | e2e |
| `npm run test:ci` | migrate + seed test db + e2e |
| `npm run socket:listen` | watch events |

</details>

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

## time spent

_~4–5h — adjust before final submit._

## ai disclosure

cursor used for boilerplate and tests; behavior checked against the brief; `npm run test:ci` run locally.
