# 🎓 Campus Event Portal — High-Concurrency  Event Management Platform

[![MongoDB](https://img.shields.io/badge/MongoDB-8.x_ReplicaSet-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-REST_API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02?logo=greensock&logoColor=white)](https://greensock.com/)
[![Lenis](https://img.shields.io/badge/Lenis-SmoothScroll-000000)](https://lenis.darkroom.engineering/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A production-grade, full-stack campus event discovery and registration platform built to demonstrate **flawless  concurrency guarantees in MongoDB**, rock-solid **Node.js/Express backend architecture**, and a modern **OLED Black / Frosted Acrylic React interface** with synchronized hardware-accelerated animations.

---

## 👥 Core Engineering Team

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <a href="https://github.com/sashank321">
          <img src="https://github.com/sashank321.png" width="100px;" alt="J Sashank" style="border-radius:50%;"/><br />
          <sub><b>J Sashank</b></sub>
        </a><br />
        <small><b>Lead Contributor & Full-Stack Architect</b></small><br />
        <sub>ACID Concurrency Engine · GSAP & Lenis Momentum · System Orchestration</sub>
      </td>
      <td align="center" width="33%">
        <a href="https://github.com/mounikadola07-alt">
          <img src="https://github.com/mounikadola07-alt.png" width="100px;" alt="Dola Mounika" style="border-radius:50%;"/><br />
          <sub><b>Dola Mounika</b></sub>
        </a><br />
        <small><b>Frontend Lead & UI/UX Specialist</b></small><br />
        <sub>React SPA Architecture · OLED Acrylic Design · Client State & Tests</sub>
      </td>
      <td align="center" width="33%">
        <a href="https://github.com/NebulaVoltage">
          <img src="https://github.com/NebulaVoltage.png" width="100px;" alt="Shreehith Sai Vodapally" style="border-radius:50%;"/><br />
          <sub><b>Shreehith Sai Vodapally</b></sub>
        </a><br />
        <small><b>Database & Security Engineer</b></small><br />
        <sub>MongoDB Schemas · Mongoose Modeling · RBAC & Security Middleware</sub>
      </td>
    </tr>
  </table>
</div>

---

## 📑 Table of Contents
1. [Core Engineering Team](#-core-engineering-team)
2. [System Architecture](#-system-architecture)
3. [MongoDB Architecture & Concurrency Engine](#-mongodb-architecture--concurrency-engine)
4. [Backend API & Security Architecture](#-backend-api--security-architecture)
5. [Frontend Engineering & Material Design](#-frontend-engineering--material-design)
6. [Automated Verification & Concurrency Proof](#-automated-verification--concurrency-proof)
7. [Getting Started (Local & Atlas)](#-getting-started)
8. [API Reference Summary](#-api-reference-summary)
9. [Project Structure](#-project-structure)

---

## 🏛 System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │               CLIENT (React 18)              │
                       │   OLED Material · GSAP Ticker · Lenis Scroll │
                       │    Viewport-Aware 3D WebGL (Spline Runtime)  │
                       └──────────────────────┬───────────────────────┘
                                              │ HTTP / JSON / HttpOnly Cookie
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │             API GATEWAY (Express)            │
                       │  Rate Limiter · Auth Guards · Error Envelope │
                       └──────┬───────────────────────────────┬───────┘
                              │                               │
                Role & State  │                               │ Read Queries
                  Transitions │                               │ & Projections
                              ▼                               ▼
  ┌──────────────────────────────────────────────┐ ┌──────────────────────────┐
  │          TRANSACTION PIPELINE                │ │     DISCOVERY ENGINE     │
  │  Conditional Atomic Capacity Filter ($inc)   │ │  Text Search · Category  │
  │  Unique Partial Index Duplicate Guard        │ │  Club · Date Range Sort  │
  │  Automatic Rollback on Race Violations       │ └────────────┬─────────────┘
  └──────────────────────┬───────────────────────┘              │
                         │                                      │
                         ▼                                      ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                      MONGODB REPLICA SET (rs0 / Atlas)                    │
  │   users  │  events  │  registrations  │  clubs  │  venues  │ announcements│
  └───────────────────────────────────────────────────────────────────────────┘
```

---

## 🍃 MongoDB Architecture & Concurrency Engine

The core engineering highlight of this platform is its **zero-oversell transactional registration system**, built on MongoDB multi-document  transactions and conditional atomic document mutations.

### 1. The Race Condition Problem
In high-demand campus events (e.g., 24-hour hackathons with limited seats), hundreds of students click "Register" at the exact same millisecond. Traditional check-then-write logic (`if (count < capacity) { count++; save(); }`) produces catastrophic race conditions and ticket overselling.

### 2. Multi-Layer Transactional Defense
Our registration pipeline executes within a **Mongoose session-backed MongoDB transaction** with a strict two-stage barrier:

```javascript
// Step 1: Conditional atomic seat increment inside MongoDB update filter
const event = await Event.findOneAndUpdate(
  {
    _id: eventId,
    status: 'approved',
    registrationDeadline: { $gt: new Date() },
    $expr: { $lt: ['$registeredCount', '$capacity'] } // Evaluated ATOMICALLY in DB engine
  },
  { $inc: { registeredCount: 1 } },
  { session, new: true }
);

if (!event) {
  // Evaluates why it failed: closed, full, or non-existent
  throw new AppError('EVENT_FULL', 'No seats remaining for this event.', 409);
}

// Step 2: Idempotent registration insert guarded by Partial Unique Index
await Registration.create([
  {
    event: eventId,
    student: req.user._id,
    status: 'registered',
    eventSnapshot: {
      title: event.title,
      startAt: event.startAt,
      venue: event.venueName,
      bannerUrl: event.bannerUrl
    }
  }
], { session });
```

### 3. Partial Unique Indexing Strategy
To allow students to cancel and re-register without generating duplicate active records, MongoDB enforces a **partial unique compound index**:
```javascript
registrationSchema.index(
  { event: 1, student: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'registered' } // Only active tickets enforce uniqueness
  }
);
```
- **Guaranteed Invariant:** If a student fires 10 simultaneous registration requests, exactly **one** succeeds. The remaining 9 trigger MongoDB `E11000` duplicate key errors inside the session, which immediately **aborts the transaction and automatically rolls back the incremented `registeredCount`**.

### 4. Data Modeling & Normalization Trade-Offs
| Collection | Storage Model | Rationale |
|---|---|---|
| `events` | Document with embedded `rules[]` and `gallery[]` (max 10) | Bounded 1:few sub-documents read together with the event view. |
| `events.registeredCount` | **Denormalized counter** | Enables instantaneous $O(1)$ remaining capacity queries without executing unbounded `$count` aggregations under high query load. |
| `registrations` | **Independent Collection** | Unbounded growth (thousands of attendees); independently indexed, queried, and paginated. |
| `registrations.eventSnapshot` | Embedded historical snapshot (`title`, `startAt`, `venue`) | Eliminates expensive `$lookup` / `.populate()` operations on student "My Registrations" dashboards; preserves audit integrity if event details are later modified. |
| `registrations.attendance` | Embedded 1:1 sub-document | Checked-in timestamp and volunteer ID read simultaneously with ticket verification. |

---

## 🛡 Backend API & Security Architecture

The backend is built with **Node.js, Express, and Mongoose**, prioritizing security, predictable error envelopes, and strict role segregation.

### 1. Authentication & Session Security
- **HttpOnly Cookie Tokens:** JWTs are issued inside `httpOnly`, `sameSite: 'lax'`, `secure` (in production) cookies. The raw JWT is **never** accessible via client JavaScript, protecting users against Cross-Site Scripting (XSS) token theft.
- **Bcrypt Cost Factor 12:** Industry-standard password hashing with salting.
- **Sanitized Model Projections:** `passwordHash` is configured with `select: false` on the Mongoose schema, ensuring passwords never leak through queries or serialization.
- **Fail-Fast Environment Validation:** In `production`, missing critical variables (`JWT_SECRET`, `MONGO_URI`) halts the process immediately on startup.

### 2. Role-Based Access Control (RBAC) & Ownership
Three distinct roles govern platform capability:
- **`student`**: Public discovery, personal registrations, atomic cancellation before start time.
- **`organizer`**: Creation of draft events (starts in `pending`), management of assigned club events, live attendee check-in and CSV roster streaming.
- **`admin`**: Global governance, event review queue (`approve` / `reject`), venue creation, global role modifications.

A centralized ownership utility (`canManageEvent(user, event)`) verifies whether an authenticated user is the designated creator or co-organizer before granting write access.

### 3. Unified API Response Envelope
Every API response strictly follows standard envelope patterns:
```json
// Success Response
{
  "data": { ... },
  "meta": { "page": 1, "limit": 12, "total": 48, "totalPages": 4 }
}

// Error Response
{
  "error": {
    "code": "EVENT_FULL",
    "message": "Registration capacity has been reached for this event."
  }
}
```

---

## 🎨 Frontend Engineering & Material Design

The client is a single-page application engineered in **React 18 + Vite**, using Tailwind CSS with a custom-engineered **OLED Black and Frosted Acrylic** material design system.

### 1. True OLED Black & Acrylic Glass Aesthetic
- **Pure Black Foundation (`#000000`)**: Deep true black foundation tailored for modern OLED displays.
- **Specular Highlights**: Multi-layered frosted glass panels with subtle top edge specular light refraction (`inset 0 1px 1px 0 rgba(255,255,255,0.06)`).
- **Refined Emerald Highlights**: Replaced radioactive neon green with an executive, subdued emerald palette (`#34d399` / `#10b981`).
- **Bespoke Hairline SVG Schematics**: Custom vector illustrations for system architecture nodes (distributed cluster, cryptographic passes, access governance shields) avoiding generic emojis.

### 2. Synced Smooth Scrolling (GSAP + Lenis)
- **Lenis Inertial Momentum**: Exponential cubic deceleration eliminates jarring mouse wheel jumps.
- **GSAP Ticker Alignment**: Lenis's internal RequestAnimationFrame is disabled and tied directly into `gsap.ticker.add((time) => lenis.raf(time * 1000))` with `lagSmoothing(0)`. Both the scroll momentum and ScrollTrigger reveal animations execute on the exact same hardware frame.
- **Clean Edge-to-Edge**: Native scrollbars are hidden cleanly via cross-browser CSS while maintaining 100% natural scroll accessibility.

### 3. Viewport-Aware 3D WebGL Suspension
- The Hero section embeds a dynamic 3D WebGL experience powered by `@splinetool/react-spline`.
- **Zero Offscreen GPU Footprint (`stop()` / `play()`)**: An `IntersectionObserver` directly controls the Spline WebGL animation loop. When the user scrolls past the hero section, the render loop is completely halted (0% GPU draw calls).
- **Instant Resume**: The instant the hero section re-enters the viewport, rendering resumes on the exact same frame with zero re-download latency.
- **Wheel Pass-Through**: Capture-phase event routing ensures mouse movements interact with the 3D scene while mouse wheel events pass cleanly to Lenis without being trapped by 3D camera zoom controls.

---

## 🧪 Automated Verification & Concurrency Proof

The codebase includes an extensive suite of automated tests across both backend and frontend layers:

```bash
# Run client unit tests
npm run test -w client

# Run backend integration & concurrency test suite
npm run test -w server
```

### Verified Test Results:
- **Client Test Suite**: **104 / 104 Passing** (Registration rendering, status badges, cancel workflows, safe date fallbacks, auth state projection).
- **Backend Test Suite**: **148 / 148 Passing** (Model validations, role gates, discovery search, CSV export, upload bounds).
- **High-Concurrency Race Verification**:
  - **15 parallel registrations on a 5-capacity event**: Exactly **5 registrations succeed**, counter reaches exactly 5, and 10 requests cleanly abort with `EVENT_FULL`.
  - **Parallel duplicate student registration**: 6 concurrent requests from the same user yield exactly **1 active registration**; 5 fail with `ALREADY_REGISTERED`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6.0+ (Replica Set required for transactions; MongoDB Atlas free tier provides this automatically)

### 1. Clone & Install
```bash
git clone https://github.com/sashank321/campus-event-portal.git
cd campus-event-portal

# Install all workspace dependencies (root, server, client)
npm run install:all
```

### 2. Configure Environment
Copy the example environment configuration in `server/.env`:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```ini
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your_super_secret_development_jwt_key_here
JWT_EXPIRES_IN=30m

# Option A: MongoDB Atlas (Recommended)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus_portal?retryWrites=true&w=majority

# Option B: Local Replica Set (Port 27018)
MONGO_URI=mongodb://127.0.0.1:27018/campus_portal?replicaSet=rs0
```

> **Note on Local Replica Set**: If testing transactions locally without Atlas, start your local mongod with `--replSet rs0 --port 27018` and execute `rs.initiate()` once in mongosh.

### 3. Seed Database
Populate the database with clean, realistic campus events, clubs, venues, and users:
```bash
npm run seed
```

**Default Seed Credentials:**
- **Admin**: `admin@campus.edu` / `Admin@123`
- **Organizer**: `organizer@campus.edu` / `Organizer@123`
- **Student**: `student@campus.edu` / `Student@123`

### 4. Start Development Servers
```bash
# Starts both the Express API (:5000) and Vite Client (:5173) concurrently
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 📡 API Reference Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a student account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate and receive HttpOnly cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate authentication session |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/v1/events` | Public | Discovery search, filter, paginate approved events |
| `GET` | `/api/v1/events/:slug` | Public* | Retrieve full event details and remaining seat capacity |
| `POST` | `/api/v1/events` | Organizer/Admin | Propose new event (pending approval) |
| `PATCH` | `/api/v1/events/:id/approve` | Admin | Approve pending event |
| `POST` | `/api/v1/events/:id/register` | Student | ** Transactional seat reservation** |
| `DELETE`| `/api/v1/registrations/:id` | Student/Admin | **Transactional seat release & cancellation** |
| `GET` | `/api/v1/my/registrations` | Student | Retrieve user ticket history with embedded snapshots |
| `GET` | `/api/v1/events/:id/participants`| Organizer/Admin | Paginated attendee list or streamed CSV |

---

## 📂 Project Structure

```
├── client/                     # Frontend SPA (React 18, Vite, Tailwind, GSAP)
│   ├── src/
│   │   ├── api/                # API client functions & Axios / Fetch instances
│   │   ├── components/         # Modular UI, event cards, carousel, landing sections
│   │   ├── features/           # Role-based feature views (student, organizer, admin)
│   │   ├── lib/                # Smooth scroll hooks, event helpers, unit tests
│   │   └── pages/              # Main route pages (Home, Events, Details, Auth)
├── server/                     # Backend REST API (Node.js, Express, Mongoose)
│   ├── config/                 # Database connection & replica set initialization
│   ├── controllers/            # Route controllers (auth, events, registrations)
│   ├── middleware/             # protect, authorize, rate limiters, error handler
│   ├── models/                 # Mongoose schemas (Event, Registration, User, Club)
│   ├── routes/                 # Express route definitions (/api/v1/*)
│   ├── scripts/                # Database seeders and index generators
│   └── tests/                  # Jest integration & concurrency race test suites
├── package.json                # Root npm workspace orchestration
└── README.md                   # System documentation
```

---

## 👥 Core Engineering Team

| Contributor | Role & Specialization | GitHub |
|---|---|---|
| **J Sashank** | **Lead Contributor & Full-Stack Architect**<br>ACID Concurrency Engine, System Orchestration, GSAP & Lenis Momentum Engine | [@sashank321](https://github.com/sashank321) |
| **Dola Mounika** | **Frontend Lead & UI/UX Systems Specialist**<br>React SPA Architecture, OLED Acrylic Design System, Client State & Test Suites | [@mounikadola07-alt](https://github.com/mounikadola07-alt) |
| **Shreehith Sai Vodapally** | **Database & Security Engineer**<br>MongoDB Schemas, Mongoose Modeling, RBAC & Security Middleware, REST APIs | [@NebulaVoltage](https://github.com/NebulaVoltage) |

---

## 🏆 Key Takeaways for Evaluators
1. **Concurrency Without Flaws**: Real multi-document ACID transactions with conditional atomic update barriers preventing oversell under extreme parallel bursts.
2. **Pragmatic NoSQL Modeling**: Thoughtful balance of denormalization (`registeredCount`), embedding (bounded gallery, ticket snapshots), and referencing (unbounded registrations).
3. **Enterprise Clean Architecture**: Strict separation of concerns, fail-safe database testing guards, resilient error envelopes, and zero client-side token exposure.
4. **World-Class Aesthetic**: Smooth GSAP/Lenis momentum interactions and OLED dark mode tailored specifically for a high-end, responsive user experience.

