# Campus Admin Agent

AI-powered admin system with memory that manages student records, analytics, and contextual conversations.

Features
- FastAPI backend with async routes
- MongoDB via Motor
- Agent with memory + tool calling (OpenAI function calling)
- Chat endpoints: /chat (sync), /chat/stream (SSE via GET or POST)
- Students CRUD: /students
- Analytics: /analytics (counts, department breakdown, time series)
- React frontend (Vite) with React Router, MUI, Recharts
- Streaming chat UI using EventSource (SSE)
- Postman collection included

Backend setup
1) Prereqs
- Python 3.10+
- MongoDB running locally or in the cloud
- OpenAI API key

2) Create venv and install deps
- py -m venv .venv
- .\.venv\Scripts\Activate.ps1
- pip install fastapi uvicorn[standard] motor pymongo pydantic openai

3) Environment variables
- $env:MONGODB_URI = "mongodb://localhost:27017"  # default
- $env:MONGODB_DB = "campus_admin"                # default
- $env:OPENAI_API_KEY = "{{OPENAI_API_KEY}}"      # required
- Optional: $env:AGENT_MODEL = "gpt-4o-mini"

4) Run the backend
- uvicorn backend.main:app --reload
- Test: http://127.0.0.1:8000/health

Frontend setup (Vite + React)
1) Prereqs
- Node.js 18+

2) Install deps
- cd frontend
- npm install

3) Configure API base URL (optional)
- Create frontend/.env and set:
  VITE_API_BASE_URL=http://localhost:8000

4) Run the dev server
- npm run dev
- Open http://localhost:5173

Endpoints summary
- GET /health
- Students CRUD
  - POST /students
  - GET /students
  - GET /students/{student_id | _id}
  - PUT /students/{_id}
  - DELETE /students/{_id}
- Chat
  - POST /chat  { session_id, message }
  - GET /chat/stream?session_id=...&message=...  (SSE, for EventSource)
  - POST /chat/stream { session_id, message }     (SSE, alt for non-browser clients)
- Analytics
  - GET /analytics

Agent behavior
- Uses OpenAI function calling to invoke tools:
  - Student Management: add/get/update/delete/list
  - Analytics: totals, by department, recent onboarded, active last 7 days
  - FAQ: cafeteria timings, library hours, events
  - Notifications: send_email (mock log)
- Memory stored in MongoDB collection 'conversations' keyed by session_id.

Indexes
- students: unique(student_id), unique(email), department, status, joined_at desc, last_active_at desc
- conversations: unique(session_id), updated_at desc

Postman collection
- campus-admin-agent.postman_collection.json at project root

Production notes
- Restrict CORS (backend/main.py) to known frontend origins
- Configure proper logging and error handling
- Consider rate-limiting and authentication (e.g., API keys/JWT) for admin endpoints
- Add TTL/archive strategy for old conversations and analytics aggregations cache if needed

Project structure
campus-admin-agent/
│── backend/
│   ├── main.py
│   ├── agent.py
│   ├── tools.py
│   ├── db.py
│   └── routes/
│       ├── students.py
│       ├── chat.py
│       └── analytics.py
│── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── pages/
│       │   ├── Chat.jsx
│       │   ├── Dashboard.jsx
│       │   └── Students.jsx
│── campus-admin-agent.postman_collection.json
│── README.md
