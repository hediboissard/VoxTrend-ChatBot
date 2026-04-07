# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoxTrend ChatBot is a multi-tenant live chat platform. Businesses (clients) embed a widget on their site; their support agents respond via a dashboard. Communication is real-time via Socket.io.

Three sub-projects:
- **`backend/`** — Node.js/Express REST API + Socket.io server (CommonJS)
- **`dashboard/`** — React 19 + Vite SPA for agents (ESM)
- **`widget/`** — Vanilla JS embeddable chat widget, served statically by the backend

## Commands

### Backend
```bash
cd backend
npm run dev      # nodemon (watch mode)
npm start        # node (production)
```

### Dashboard
```bash
cd dashboard
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Database migrations
Each migration script is run once manually:
```bash
cd backend
node src/db/migrate.js                  # Initial schema
node src/db/add-ticket-number.js        # Add ticket numbers
node src/db/migrate-text-color.js       # Add widget_text_color
node src/db/migrate-widget-height.js    # Add widget_height
node src/db/migrate-widget-settings.js  # Add widget_greeting/subtitle/faq
```

## Environment

Backend requires `backend/.env`:
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voxtrend_dev
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=<secret>
```

## Architecture

### Multi-tenancy model
Each `client` row has an `api_key` (UUID). The widget identifies itself with this key. All data (users, conversations, messages) is scoped to a `client_id`. Agents log in and receive a JWT containing `{ userId, clientId, email, role }`.

### Database schema (PostgreSQL)
`clients` → `users` (agents), `conversations` → `messages`

Key `clients` columns for widget customization: `widget_color`, `widget_text_color`, `widget_logo_url`, `widget_greeting`, `widget_subtitle`, `widget_faq` (JSONB), `widget_height`.

### Real-time flow (Socket.io rooms)
- `conversationId` room — joined by both widget visitor and dashboard agent; used for `new_message` events
- `client_<clientId>` room — joined by agents; receives `notification` and `conversation_created` events when a visitor starts a new conversation or sends a message

### Backend routes
- `POST /api/auth/*` — login/register
- `GET|PUT /api/widget/config` — public config fetched by widget via `?apiKey=`
- `GET|PUT /api/widget/settings` — authenticated agent settings CRUD
- `GET|POST /api/conversations/*` — conversation management (JWT-protected)
- `POST /api/upload` — file uploads via multer, stored in `backend/uploads/`
- `/widget/*` — static serving of `widget/` directory

### Widget embedding
Clients add `widget-loader.js` to their page. It reads `window.VoxConfig.apiKey`, injects `widget.js` from the backend. The widget fetches `/api/widget/config?apiKey=` to get branding/config, then connects to Socket.io.

### Dashboard auth
JWT stored in `localStorage` as `vox_token`. The axios instance in `dashboard/src/lib/axios.js` attaches it automatically. `PrivateRoute` in `App.jsx` guards `/conversations` and `/settings`.
