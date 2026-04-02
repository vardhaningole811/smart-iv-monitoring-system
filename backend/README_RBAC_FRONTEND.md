# Hexagon Backend — Frontend Integration (Auth + RBAC + Nodes)

This document explains how the React frontend should authenticate, fetch vitals/alerts/insights, and receive real-time updates via Socket.io.

## 1) Authentication

### Login
- `POST /api/auth/login`
- Body: `{ "email": "...", "password": "..." }`
- Response: `{ success: true, data: { token, user: { id, role, email } } }`

Store `data.token` in `localStorage` as `smartiv_token`.

### JWT header (required for all data endpoints)
- `Authorization: Bearer <token>`

### Current roles
- `doctor`
- `patient`

## 2) RBAC data scope

All “data read” endpoints require authentication.

- **Patient**: only receives/queries records where `patientId === auth.userId`.
- **Doctor**: receives all records.

Practical note: the backend enforces this on REST responses and on Socket.io emissions.

## 3) Nodes (multi-device data sources)

The system models sensors/cameras as **nodes**. A node can be assigned to a **patient** by a doctor.

### Endpoints
- `POST /api/nodes/register` (doctor only)
  - Registers a node by `nodeKey` and `host`.
- `POST /api/nodes/:nodeId/assign` (doctor only)
  - Assigns the node to a `patientId`.
- `DELETE /api/nodes/:nodeId/assign` (doctor only)
  - Revokes the node’s assigned patient.
- `GET /api/nodes`
  - Doctor: all nodes
  - Patient: only nodes assigned to them

### Mock ingestion (dev only)
For development/testing, the backend can generate mock vitals + IV events from assigned nodes.

Enable with:
- `MOCK_NODE_INGESTION=true`
- Optional: `MOCK_NODE_TICK_MS` (default `5000`)

When nodes are assigned, mock vitals will be inserted into MongoDB and emitted to the correct Socket.io rooms.

## 4) REST endpoints to integrate

All endpoints below require `Authorization: Bearer ...`.

### Vitals
- `POST /api/vitals`
  - Creates a vitals record (expects `patientId` in body; patients are forced to their own id).
- `GET /api/vitals/latest`
- `GET /api/vitals/history?limit=100`

### Alerts
- `GET /api/alerts`
- `POST /api/alerts`

### Events + Insights
- `POST /api/events`
  - `type` is `iv_start` or `iv_stop`.
  - `iv_start` triggers drug-curve computation asynchronously and emits `insight:update`.
- `GET /api/insights?patientId=<id>` (doctor) or no param (patient)

### Patient-scoped convenience routes (what the frontend uses)
- `GET /api/patients`
- `GET /api/patient/:id/latest`
- `GET /api/patient/:id/history?limit=100`
- `GET /api/patient/:id/drug-impact` (alias of last computed insights)

### Camera frame
- `POST /api/analyze-frame`
  - `multipart/form-data` with field name `frame`
  - Returns `{ status: 'normal' | 'backflow' | 'empty' | 'air_detected' }` or `{ status: 'error', message }`

## 5) Real-time updates (Socket.io)

Socket.io is used for the real-time feed.

### Connection requirements
The frontend must pass the JWT token during Socket.io connection:

```js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket", "polling"],
  auth: { token: localStorage.getItem("smartiv_token") },
});

socket.on("vitals:new", (payload) => { /* update charts */ });
socket.on("alert:new", (payload) => { /* prepend alert */ });
socket.on("insight:update", (payload) => { /* update insight banner + drug curve */ });
```

### Which clients receive which data
- `patient` receives:
  - `vitals:new` for their `patientId`
  - `alert:new` for their `patientId`
  - `insight:update` for their `patientId`
- `doctor` receives:
  - all `vitals:new`, `alert:new`, `insight:update`

## 6) Troubleshooting

- If Socket.io events don’t arrive: check that the JWT token is present and is being sent in `auth: { token }`.
- If patient sees no data: ensure vitals/events/alerts inserted include `patientId`.
- If insights don’t update: ensure `POST /api/events` includes `patientId` and `type: "iv_start"`.

