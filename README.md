# SkillBridge — Community Skill Exchange

A polished MERN platform for people to exchange what they know for what they want to learn.

## Start locally

1. Copy `server/.env.example` to `server/.env`, then set `MONGO_URI` and a strong `JWT_SECRET`.
2. Run `npm.cmd run install:all` from the repository root. This installs the root runner as well as the client and API packages.
3. Run `npm.cmd run dev`.
4. Open `http://localhost:5173`.

## Run with Docker

Docker starts the frontend, API, and MongoDB together. Create a root `.env` file with a strong `JWT_SECRET`, then run:

```powershell
docker compose up --build
```

Open `http://localhost:8080`. MongoDB data is retained in the named `mongo_data` volume. To stop the stack, run `docker compose down`.

## Included

- Professional responsive discovery UI with search, filters, recommendation cards, and exchange-request flow.
- JWT authentication, bcrypt password hashing, protected routes, and profile updates.
- MongoDB models for users, exchange requests, and scheduled sessions.
- Matching endpoint that scores reciprocal teach/learn skills, location, shared language, and rating.

## API

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`  
`GET /api/users/discover`, `GET /api/users/:id`, `PUT /api/users/profile`  
`GET|POST /api/exchanges`, `PATCH /api/exchanges/:id`  
`GET|POST /api/sessions`
