<div align="center">

<img src="appointment-api/assets/logo.svg" width="56" height="56" alt="logo" />

# elham

appointment booking — recruitment exercise

[mirza baig](https://www.meetmirza.com/) · [meetmirza.com](https://www.meetmirza.com/)

</div>

monorepo-style layout: one submission package (`appointment-api/`) plus a stub folder at repo root. all setup, api docs, tests, and zip instructions live in the api readme.

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="node 20+" />
  <img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="nestjs" />
  <img src="https://img.shields.io/badge/postgres-14%2B-4169E1?logo=postgresql&logoColor=white" alt="postgres" />
  <img src="https://img.shields.io/badge/e2e-12%20tests-1B8354" alt="e2e tests" />
  <img src="https://img.shields.io/badge/socket.io-4-010101?logo=socket.io&logoColor=white" alt="socket.io" />
</p>

---

## what this is

| piece | path | role |
|-------|------|------|
| **submission (graded)** | [`appointment-api/`](appointment-api/) | nestjs rest api, prisma, socket.io, swagger, postgres e2e tests |
| **full documentation** | [`appointment-api/readme.md`](appointment-api/readme.md) | install, env, api contract, socket, zip |
| **optional demo ui** | [`appointment-api/demo-ui/`](appointment-api/demo-ui/) | bilingual demo; **not** in submission zip |
| `demo-ui/` (root) | legacy redirect only | ignore — use `appointment-api/demo-ui/` |

stack: typescript · nestjs · postgresql · prisma · socket.io · openapi (swagger ui)

---

## quick start

```bash
git clone https://github.com/MiirzaBaig/elham.git
cd elham/appointment-api

npm install
cp .env.example .env && cp .env.example .env.test

# see appointment-api/readme.md for db names + test:ci
npm run test:ci
npm run start:dev
```

| after start | url |
|-------------|-----|
| swagger | http://localhost:3000/docs |
| openapi | http://localhost:3000/openapi.json |
| optional demo (dev) | `npm run demo:dev` → http://localhost:5173 |
| optional demo (built) | `npm run demo:build` → http://localhost:3000/demo/ |

**submission zip:** from `appointment-api/`, run `npm run zip`.

---

## repo map

```
elham/
├── readme.md                 ← you are here
├── appointment-api/          ← submit this folder (as zip)
│   ├── readme.md             ← detailed spec + reviewer guide
│   ├── src/                  ← nest modules
│   ├── prisma/               ← schema, migrations, seed
│   ├── test/e2e/             ← 12 postgres tests
│   └── demo-ui/              ← optional (excluded from zip)
└── demo-ui/                  ← stub; do not use
```

---

## highlights

- one **active** booking per slot (postgres partial unique index)
- concurrent double-book → **201** + **409**
- socket events **`slot.booked`** / **`slot.released`** after commit
- no auth, no extra endpoints — matches exercise brief

---

## links

<p align="center">
  <a href="https://www.meetmirza.com/" title="mirza baig — portfolio">
    <img src="https://img.shields.io/badge/author-mirza_baig-0B3D2E?style=for-the-badge&logo=vercel&logoColor=F7F5EF" alt="author: mirza baig" />
  </a>
  <a href="appointment-api/readme.md" title="api setup, tests, and spec">
    <img src="https://img.shields.io/badge/api-readme-1B8354?style=for-the-badge&logo=markdown&logoColor=white" alt="api readme" />
  </a>
  <a href="https://github.com/MiirzaBaig/elham" title="source repository">
    <img src="https://img.shields.io/badge/repo-elham-181717?style=for-the-badge&logo=github&logoColor=white" alt="github repo" />
  </a>
</p>
