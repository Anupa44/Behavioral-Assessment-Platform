# Behavioral Assessment Platform

A self-serve web application for creating, distributing, and analyzing MCQ-based behavioral assessments. Supports DISC and Big Five frameworks.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query |
| Backend | Django 4.2, Django REST Framework |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + Celery |
| Auth | JWT (SimpleJWT) + Google OAuth |
| AI | OpenAI / OpenRouter / Gemini (configurable) |
| Email | Google SMTP (Gmail App Password) |
| Infrastructure | Docker + Docker Compose |

## Quick Start

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `EMAIL_HOST_USER` | Your Gmail address |
| `EMAIL_HOST_PASSWORD` | Gmail [App Password](https://myaccount.google.com/apppasswords) (not your Gmail password) |
| `AI_PROVIDER` | `openrouter`, `openai`, or `gemini` |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) |

Also edit `frontend/.env`:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Start everything

```bash
docker compose up --build
```

This will:
- Start PostgreSQL and Redis
- Run Django migrations
- Load DISC and Big Five framework fixtures
- Start the Django dev server on port 8000
- Start the Celery worker
- Start the Vite dev server on port 5173

### 4. Open the app

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

### 5. Create a superuser (optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

## Development

### Backend only
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata frameworks
python manage.py runserver
```

### Frontend only
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── bap/                # Django project config
│   └── apps/
│       ├── accounts/       # Maker auth (register, login, Google OAuth, password reset)
│       ├── frameworks/     # DISC, Big Five data
│       ├── assessments/    # Assessment CRUD, questions, AI generation
│       ├── invitations/    # Invitation batches, dedicated links, emails
│       ├── participants/   # Participant session, answer saving, submission
│       ├── results/        # Trait scoring, behavioral profile assembly
│       └── dashboard/      # Cohort analytics, individual result views
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── auth/       # Login, Register, Verify, Reset password
│       │   ├── maker/      # Dashboard, Assessment editor, Questions, Invitations, Analytics
│       │   └── participant/ # Assessment taking, Confirmation
│       ├── api/            # Axios API clients
│       ├── components/     # Reusable UI components
│       └── types/          # TypeScript interfaces
└── docker-compose.yml
```

## Key Features

- **Maker**: Create assessments manually or with AI, publish, send invitation batches (CSV or paste), track completion on a dashboard
- **Participant**: No account needed — click link, answer questions, auto-save progress, submit
- **Scoring**: Rule-based trait scoring, normalized 0–100, score band assignment with interpretive text
- **AI Generation**: Send a prompt → AI generates questions with trait mappings → review, edit, regenerate, accept
- **Email**: Google SMTP — verification, password reset, invitation, result email (configurable per assessment)
- **Google OAuth**: One-click sign in
