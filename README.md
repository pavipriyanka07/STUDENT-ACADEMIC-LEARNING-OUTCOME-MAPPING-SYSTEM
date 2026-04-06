# Academic Learning Outcome Mapping System

Full-stack MERN project for managing Courses, Subjects, Course Outcomes (CO), Program Outcomes (PO), and CO-PO Mapping Matrix.

## Tech Stack
- Frontend: React, Axios, React Router, CSS
- Backend: Node.js, Express, JWT, bcrypt
- Database: MongoDB with Mongoose

## Folder Structure

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  server.js
frontend/
  src/
    components/
    pages/
    services/
    App.js
```

## MongoDB Schema Design

1. `Admin`
- `username` (String, unique, required)
- `password` (String, required, hashed with bcrypt)

2. `Course`
- `name` (String, required)
- `code` (String, unique, required)
- `description` (String)

3. `Subject`
- `course` (ObjectId -> Course, required)
- `name` (String, required)
- `code` (String, required, unique within course)
- `semester` (Number, required)

4. `CourseOutcome`
- `subject` (ObjectId -> Subject, required)
- `code` (String, required, unique within subject)
- `description` (String, required)

5. `ProgramOutcome`
- `code` (String, unique, required)
- `description` (String, required)

6. `Mapping`
- `courseOutcome` (ObjectId -> CourseOutcome, required)
- `programOutcome` (ObjectId -> ProgramOutcome, required)
- `level` (Number, enum: 1, 2, 3)
- Unique on (`courseOutcome`, `programOutcome`)

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register` -> Create admin
- `POST /auth/login` -> Login admin and get JWT

### Courses (Protected)
- `GET /courses`
- `POST /courses`
- `PUT /courses/:id`
- `DELETE /courses/:id`

### Subjects (Protected)
- `GET /subjects?courseId=`
- `POST /subjects`
- `PUT /subjects/:id`
- `DELETE /subjects/:id`

### Course Outcomes (Protected)
- `GET /course-outcomes?subjectId=`
- `POST /course-outcomes`
- `PUT /course-outcomes/:id`
- `DELETE /course-outcomes/:id`

### Program Outcomes (Protected)
- `GET /program-outcomes`
- `POST /program-outcomes`
- `PUT /program-outcomes/:id`
- `DELETE /program-outcomes/:id`

### Mappings (Protected)
- `GET /mappings?subjectId=`
- `POST /mappings` (upsert mapping)
- `DELETE /mappings/:id`
- `GET /mappings/matrix?subjectId=` -> matrix table data

## Dummy Data

Run backend seed script:

```bash
cd backend
npm install
copy .env.example .env
npm run seed
```

Seed credentials:
- Username: `admin`
- Password: `admin123`

## Local Run Steps

### Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm start
```

Frontend URL: `http://localhost:3000`

## Notes
- If local MongoDB is not running, backend uses in-memory MongoDB when `USE_IN_MEMORY_DB=true` (default in `.env`).
- Enable MongoDB locally before running backend.
- CORS, validation, JWT auth, and error handling are included.
- CO-PO levels: `1=Low`, `2=Medium`, `3=High`.
- On backend startup, a default admin is created if none exists:
  - Username: `admin` (or `DEFAULT_ADMIN_USERNAME`)
  - Password: `admin123` (or `DEFAULT_ADMIN_PASSWORD`)
- If you see `Invalid or expired token`, log in again. Old tokens are auto-cleared on `401`.

## Deployment

This repo is prepared for a single-service Render deployment:

1. Create a MongoDB Atlas database and copy the connection string.
2. In Render, create a new Blueprint deployment from this GitHub repo.
3. Set these required environment variables for the Render service:
   - `MONGO_URI`
   - `DEFAULT_ADMIN_PASSWORD`
4. Render will build the React frontend, serve it from the Express backend, and expose the API at `/api`.

Important:
- In production, the backend will not fall back to in-memory MongoDB if `MONGO_URI` fails.
- Local frontend development should keep using `frontend/.env` with `REACT_APP_API_URL=http://localhost:5000/api`.
