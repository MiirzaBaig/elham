<div align="center">

<img src="appointment-api/assets/logo.svg" width="56" height="56" alt="logo" />

# elham

appointment booking — recruitment exercise

[mirza baig](https://www.meetmirza.com/) · [meetmirza.com](https://www.meetmirza.com/)

</div>

single submission package: [`appointment-api/`](appointment-api/). full setup, api contract, tests, socket verification, and zip steps are in [`appointment-api/readme.md`](appointment-api/readme.md).

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="node 20+" />
  <img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="nestjs" />
  <img src="https://img.shields.io/badge/postgres-14%2B-4169E1?logo=postgresql&logoColor=white" alt="postgres" />
  <img src="https://img.shields.io/badge/e2e-12%20tests-1B8354" alt="e2e tests" />
  <img src="https://img.shields.io/badge/socket.io-4-010101?logo=socket.io&logoColor=white" alt="socket.io" />
</p>

---

## quick start

```bash
git clone https://github.com/MiirzaBaig/elham.git
cd elham/appointment-api

npm install
cp .env.example .env && cp .env.example .env.test
# edit DATABASE_URL — two databases (see api readme)

npm run test:ci
npm run start:dev
```

| resource | url |
|----------|-----|
| swagger | http://localhost:3000/docs |
| openapi | http://localhost:3000/openapi.json |

**optional demo** (api must run first):

```bash
npm run demo:install && npm run demo:dev    # http://localhost:5173
# or: npm run demo:build → http://localhost:3000/demo/
```

**zip for submission:** `cd appointment-api && npm run zip`

---

## repo layout

```
elham/
├── readme.md              ← overview (this file)
└── appointment-api/       ← graded backend + optional demo-ui/
    └── readme.md          ← complete reviewer guide
```

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
