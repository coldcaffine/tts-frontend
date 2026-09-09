# Text-to-Speech Application

A full-stack web app that converts written text into natural-sounding speech. Users can enter text, choose a voice, generate audio, play it back, download it, and (if logged in) save it to their history with favorites.

**Live app:** https://tts-frontend-xxxx.vercel.app *(update with your actual Vercel URL)*
**Live API:** https://tts-backend-wycp.onrender.com
**API docs (Swagger):** https://tts-backend-wycp.onrender.com/docs

---

## Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS
- Axios

**Backend**
- Python + FastAPI
- [edge-tts](https://github.com/rany2/edge-tts) — free, no API key required, wide range of natural voices
- Supabase (PostgreSQL database + Auth)
- Uvicorn (ASGI server)

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database/Auth: Supabase

---

## Features

- Text input with live character counter (3000 char limit)
- Voice selection (dozens of neural voices, multiple languages/accents)
- Generate speech and play it back in-browser
- Download generated audio as MP3
- User accounts (sign up / log in) via Supabase Auth
- Speech history — saved per user, with:
  - Replay any past generation
  - Mark/unmark as favorite
  - Delete entries
- Input validation and error handling (empty text, over-length text, failed requests)

---

## Repositories

| Repo | Purpose |
|---|---|
| [`tts-frontend`](https://github.com/coldcaffine/tts-frontend) | React + Vite frontend |
| [`tts-backend`](https://github.com/coldcaffine/tts-backend) | FastAPI backend |

---

## Local Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

Run the server:

```bash
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`. Interactive API docs at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Update `src/api.js` to point `baseURL` at your local or deployed backend URL as needed.

---

## API Endpoints

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/api/health` | Health check | No |
| GET | `/api/voices?language=en` | List available voices, optionally filtered by language | No |
| POST | `/api/tts` | Generate speech audio from text | No |
| POST | `/api/auth/signup` | Create a new account | No |
| POST | `/api/auth/login` | Log in, returns access token | No |
| GET | `/api/history` | List the logged-in user's speech history | Yes |
| POST | `/api/history` | Save a generation to history | Yes |
| PATCH | `/api/history/{id}/favorite` | Toggle favorite status on a history item | Yes |
| DELETE | `/api/history/{id}` | Delete a history item | Yes |

**Example — Generate speech:**

```bash
curl -X POST https://tts-backend-wycp.onrender.com/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test.", "voice": "en-US-JennyNeural"}' \
  --output speech.mp3
```

Full interactive documentation with request/response schemas is available at `/docs` on the live backend.

---

## Database Schema

**`speech_history`** (Supabase / PostgreSQL)

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | References `auth.users(id)` |
| text | text | The generated text |
| voice | text | Voice used for generation |
| is_favorite | boolean | Default `false` |
| created_at | timestamptz | Default `now()` |

Row-Level Security is enabled — users can only read, insert, update, or delete their own history rows.

---

## Deployment Notes

- Backend deployed on Render's free tier — the instance spins down after inactivity, so the first request after idle time may take up to ~50 seconds to respond.
- Environment variables (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`) are configured directly in the Render dashboard, not committed to the repo.
- Frontend auto-redeploys on Vercel whenever changes are pushed to the `main` branch of `tts-frontend`.

---

## Notes on Scope

This project targets **Level 2** of the original spec: React + Backend + Database + TTS API + Authentication, with history, favorites, downloads, and multiple voices. Advanced features from Level 3 (AI text enhancement, PDF/DOCX upload, cloud audio storage, usage limits, admin dashboard) were out of scope for this build.
