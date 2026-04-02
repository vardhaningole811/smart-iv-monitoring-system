# Product Requirements Document
## IoT-Based Healthcare Monitoring System

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** March 2026  
**Classification:** Internal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Success Metrics](#3-goals-and-success-metrics)
4. [Stakeholders](#4-stakeholders)
5. [User Personas](#5-user-personas)
6. [Scope](#6-scope)
7. [System Architecture Overview](#7-system-architecture-overview)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Data Requirements](#10-data-requirements)
11. [API Specification](#11-api-specification)
12. [Feature Specifications](#12-feature-specifications)
13. [User Interface Requirements](#13-user-interface-requirements)
14. [Integration Requirements](#14-integration-requirements)
15. [Alert and Notification System](#15-alert-and-notification-system)
16. [Security and Compliance](#16-security-and-compliance)
17. [Release Phases and Milestones](#17-release-phases-and-milestones)
18. [Risks and Mitigations](#18-risks-and-mitigations)
19. [Open Questions](#19-open-questions)
20. [Appendix](#20-appendix)

---

## 1. Executive Summary

The IoT-Based Healthcare Monitoring System is a full-stack, real-time patient monitoring platform designed for clinical environments. It connects ESP32 microcontroller sensors at the bedside to a web-based dashboard used by nursing and clinical staff, enabling continuous observation of patient vitals without requiring a nurse to be physically present at the bedside at all times.

The system collects heart rate, blood oxygen saturation (SpO₂), and IV drip status from the sensor hardware, stores all readings in a time-series database, and surfaces the data on a live dashboard with automatic alerting when values cross clinical thresholds. A computer vision module monitors the IV line using a camera, detecting backflow, empty bottles, and air bubbles without requiring manual inspection. A rule-based Drug Impact Curve feature correlates IV drug administration events with changes in patient vitals, giving clinicians a clear picture of whether a drug is having the expected effect and how quickly.

The system is built to be modular, deployable in a hospital ward or ICU setting, and extensible for future machine learning enhancement. It does not replace clinical judgment — it extends the reach of clinical staff so that fewer patients go unobserved.

---

## 2. Problem Statement

### 2.1 Current Situation

In many hospital wards and smaller ICUs, continuous patient monitoring depends heavily on nursing staff physically checking on patients at regular intervals. Between checks, a patient's condition can deteriorate without anyone noticing. Bedside monitors exist but they are typically siloed — the alarm sounds locally, at the bedside, and does not propagate to a central station or to staff who are elsewhere in the ward.

IV drip management is particularly labor-intensive. Nurses manually check whether an IV bag is running, whether the line has backflow, and whether the drip rate is correct. In busy wards, these checks are sometimes delayed.

Post-administration drug monitoring is largely manual and relies on nursing notes. There is no automated way to correlate when an IV drug was started with how the patient's vitals changed in the following window. Clinicians often cannot answer the question "how long did it take for this patient to respond to the medication" without reviewing paper charts or scattered electronic records.

### 2.2 The Problem Being Solved

This system addresses three specific gaps:

**Gap 1 — Delayed detection of deterioration.** Vitals can drift outside safe ranges between manual checks. Staff need a system that monitors continuously and pushes alerts to them rather than requiring them to pull information.

**Gap 2 — Reactive IV management.** IV complications (backflow, empty bag, air in line) are caught too late because they rely on scheduled checks. A camera-based detection system can catch these conditions the moment they occur.

**Gap 3 — No drug response correlation.** Clinicians administer IV drugs and then wait, estimating whether the patient is responding based on spot checks. A system that automatically tracks vitals before and after IV administration, computes response delay, and generates a readable insight would give clinicians a faster, clearer picture.

### 2.3 Who Is Affected

- Patients in hospital wards, step-down units, and ICUs who are on continuous monitoring or IV therapy
- Nursing staff responsible for monitoring multiple patients simultaneously
- Physicians and residents who review patient response to medications
- Hospital administrators responsible for patient safety outcomes and adverse event rates

---

## 3. Goals and Success Metrics

### 3.1 Primary Goals

| Goal | Description |
|------|-------------|
| G1 | Deliver continuous, real-time vitals monitoring with sub-2-second latency from sensor to dashboard |
| G2 | Automatically detect and surface clinically significant anomalies without requiring manual threshold checks |
| G3 | Detect IV complications (backflow, empty bottle, air) using computer vision within the same monitoring loop |
| G4 | Generate automated drug response insights within 30 minutes of each IV administration event |
| G5 | Eliminate duplicate alert noise that causes alert fatigue |

### 3.2 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Vitals data latency (sensor to dashboard) | < 2 seconds, 95th percentile | Timestamp comparison: ESP32 POST vs socket emission receipt |
| Alert false positive rate | < 10% of generated alerts | Clinical staff review sample of 100 alerts per week |
| Alert duplicate rate | 0 duplicate alerts within a 5-minute window | Database audit of alert hash collisions |
| IV anomaly detection time | < 5 seconds from condition onset | Frame-to-response time in AI service logs |
| Drug impact curve generation | Completes within 30 seconds of 30-minute window close | Service execution time logs |
| Dashboard uptime | > 99.5% during operating hours | Server monitoring |
| Nursing staff adoption | > 80% of monitored patients have dashboard open during shift | Active session tracking |

### 3.3 Non-Goals

The following are explicitly outside the scope of this version:

- Automatic medication adjustment or dosing recommendations
- Integration with existing hospital EMR or EHR systems (deferred to v2)
- Voice-based alerting or phone call escalation
- Multi-patient grid view comparing patients side by side (deferred to v2)
- Predictive deterioration scoring using machine learning (deferred to v3)
- Regulatory medical device certification (this version is a monitoring aid, not a diagnostic device)

---

## 4. Stakeholders

| Role | Name / Team | Responsibility |
|------|-------------|----------------|
| Product Owner | Engineering Lead | Requirements prioritisation, acceptance sign-off |
| Backend Engineering | Backend Team | Express API, MongoDB, Socket.io, alert engine |
| Frontend Engineering | Frontend Team | React dashboard, real-time updates, charting |
| AI / CV Engineering | AI Team | FastAPI service, OpenCV detection, insight logic |
| Hardware / IoT | IoT Team | ESP32 firmware, sensor integration, ESP32-CAM |
| Clinical Advisor | Nursing Lead / Physician | Clinical threshold validation, workflow review |
| QA Engineering | QA Team | End-to-end test coverage, alert accuracy testing |
| DevOps | Infrastructure Team | Deployment, monitoring, environment management |

---

## 5. User Personas

### 5.1 Primary Persona — Ward Nurse

**Name:** Priya  
**Role:** Registered Nurse, General Medicine Ward  
**Context:** Priya is responsible for 6–8 patients during a 12-hour shift. She cannot be at every bedside continuously. She needs information pushed to her, not pulled.

**Needs:**
- See the current state of all monitored patients at a glance
- Receive an alert immediately when a patient's SpO₂ or heart rate goes out of range
- Know the status of every IV line without walking to each bed
- Have the alert tell her what the problem is, not just that something is wrong

**Pain Points:**
- Gets too many alerts that turn out to be nothing (alert fatigue)
- Has to physically check IV lines even when nothing is wrong
- Cannot easily explain to the physician why it took 10 minutes to respond — there is no log

**Success Looks Like:** Priya sees an alert on her dashboard, reads the message, knows which patient and which vital is out of range, and walks directly to that patient with context.

---

### 5.2 Secondary Persona — Attending Physician

**Name:** Dr. Rahul  
**Role:** Attending Physician, Internal Medicine  
**Context:** Dr. Rahul reviews patients during rounds and is called for urgent situations. He orders IV medications and needs to know whether they are working.

**Needs:**
- See the trend of a patient's vitals after an IV drug is started
- Get a plain-language summary of whether the patient responded and how quickly
- Trust that the data is accurate and timestamped correctly

**Pain Points:**
- Has to piece together drug response from nursing notes and spot-check vitals
- No easy way to see whether the SpO₂ improvement happened in 5 minutes or 25 minutes

**Success Looks Like:** Dr. Rahul opens the patient's dashboard, sees the Drug Impact Curve chart, reads "Patient responded within 6 minutes. Vitals stabilised at 14 minutes after IV start," and makes his clinical decision.

---

### 5.3 Tertiary Persona — Charge Nurse / Supervisor

**Name:** Meena  
**Role:** Charge Nurse, ICU  
**Context:** Meena oversees the ward, manages staffing, and is responsible for patient safety incidents. She needs to review what happened after an adverse event.

**Needs:**
- Audit trail of all alerts generated during a shift
- Ability to see historical vitals trends for any monitored patient
- Confidence that the system did not miss a critical event

**Pain Points:**
- Paper-based incident review is slow and incomplete
- Cannot easily answer "did the monitor detect it, and when"

**Success Looks Like:** Meena can pull the alert log for a patient, see every alert that was generated with its timestamp and severity, and correlate it with the vitals history.

---

## 6. Scope

### 6.1 In Scope — Version 1.0

- ESP32 sensor integration (heart rate, SpO₂, IV status via HTTP POST)
- ESP32-CAM frame capture and AI vision analysis
- Node.js REST API with full MVC structure
- MongoDB persistence for vitals, events, and alerts
- Socket.io real-time push to connected dashboard clients
- React dashboard with live charts, vitals cards, IV status indicator, and alert panel
- Rule-based alert engine with deduplication
- Drug Impact Curve computation and chart with IV event reference line
- Plain-language drug response insight generation
- OpenCV-based IV detection: backflow, empty bottle, air bubbles
- Basic environment-based configuration (no secrets in code)

### 6.2 Out of Scope — Version 1.0

- EMR/EHR integration
- Multi-hospital or multi-ward deployment
- Native mobile app
- Machine learning models for anomaly detection
- User authentication and role-based access control (noted as v1.1 requirement)
- Audit log export to PDF or CSV
- Printer integration for patient reports
- SMS or email alerting

---

## 7. System Architecture Overview

### 7.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Hospital Network                      │
│                                                             │
│  ┌──────────┐    HTTP POST     ┌─────────────────────────┐  │
│  │  ESP32   │ ──────────────► │   Node.js / Express     │  │
│  │  Sensor  │                 │   Backend (Port 5000)   │  │
│  └──────────┘                 │                         │  │
│                               │  ┌─────────────────┐   │  │
│  ┌──────────┐    HTTP POST    │  │  Alert Engine   │   │  │
│  │ ESP32-CAM│ ──────────────► │  │  Drug Curve Svc │   │  │
│  │  Camera  │                 │  │  AI Proxy       │   │  │
│  └──────────┘                 │  └─────────────────┘   │  │
│                               └──────────┬──────────────┘  │
│                                          │                  │
│                          ┌───────────────┼───────────────┐  │
│                          │               │               │  │
│                          ▼               ▼               ▼  │
│                    ┌──────────┐  ┌──────────┐  ┌──────────┐│
│                    │ MongoDB  │  │Socket.io │  │ FastAPI  ││
│                    │   DB     │  │  Server  │  │AI Service││
│                    └──────────┘  └────┬─────┘  │(Port 8000││
│                                       │        └──────────┘│
│                                       │ WebSocket           │
│                                       ▼                     │
│                               ┌──────────────┐             │
│                               │ React Dashboard│            │
│                               │  (Browser)    │            │
│                               └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend framework | React | 18.x | Functional components, mature hooks ecosystem |
| Frontend build tool | Vite | 5.x | Fast HMR, ES module native |
| Styling | Tailwind CSS | 3.x | Utility-first, minimal bundle, no design system lock-in |
| Charting | Recharts | 2.x | React-native, composable, supports reference lines |
| Real-time client | Socket.io client | 4.x | Matches server, handles reconnection automatically |
| Backend runtime | Node.js | 18+ LTS | ES module support, stable LTS |
| Backend framework | Express | 4.x | Minimal, well-understood, large ecosystem |
| ORM/ODM | Mongoose | 8.x | Schema validation, query API on top of MongoDB driver |
| Real-time server | Socket.io | 4.x | Bidirectional, handles reconnection, room support |
| Database | MongoDB | 7.x | Flexible schema for evolving vitals fields, native time-series |
| AI service runtime | Python | 3.10+ | Required for OpenCV ecosystem |
| AI service framework | FastAPI | 0.110+ | Async, type-annotated, fast |
| Computer vision | OpenCV | 4.9+ | Classical CV, no GPU required |
| IoT hardware | ESP32 | — | Wi-Fi native, low power, sufficient GPIO |
| Camera hardware | ESP32-CAM | — | Integrated, low cost, compatible with ESP32 ecosystem |

### 7.3 Data Flow

**Vitals path:**
1. ESP32 reads sensors every 2 seconds
2. ESP32 sends `POST /api/vitals` with JSON payload
3. Controller validates payload, saves Vitals document to MongoDB
4. Controller calls Alert Engine with saved document
5. Alert Engine evaluates thresholds, creates Alert documents if triggered, emits `alert:new` via Socket.io
6. Controller emits `vitals:new` via Socket.io
7. React client receives `vitals:new`, appends to local state, re-renders charts

**Camera path:**
1. ESP32-CAM captures frame, sends `POST /api/analyze-frame` to Node.js backend
2. Backend AI Proxy service forwards frame to FastAPI via multipart/form-data
3. FastAPI runs OpenCV detection, returns status JSON
4. Backend emits vision result to frontend via Socket.io
5. Frontend updates IV vision status panel

**Drug impact path:**
1. IV start event triggers `POST /api/events` with type `iv_start`
2. Controller saves Event document, calls Drug Curve Service asynchronously
3. Drug Curve Service fetches pre-IV baseline vitals from MongoDB
4. Over 30-minute window, service computes response delay, improvement, stabilisation
5. Service generates insight string, emits `insight:update` via Socket.io
6. Frontend receives payload, renders Drug Impact Curve chart with reference line and insight banner

---

## 8. Functional Requirements

### 8.1 Vitals Ingestion

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-V01 | System must accept POST requests containing heartRate, spo2, ivStatus, and timestamp fields | P0 |
| FR-V02 | heartRate must be validated as a number between 0 and 300 | P0 |
| FR-V03 | spo2 must be validated as a number between 0 and 100 | P0 |
| FR-V04 | ivStatus must be one of: "running" or "stopped" | P0 |
| FR-V05 | timestamp must be a valid ISO 8601 date string; if absent, server assigns current time | P1 |
| FR-V06 | Invalid payloads must return HTTP 422 with a descriptive error message | P0 |
| FR-V07 | Valid payloads must be persisted to MongoDB before any socket emission | P0 |
| FR-V08 | System must return the saved document in the success response body | P1 |

### 8.2 Vitals Retrieval

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VR01 | `GET /api/vitals/latest` must return the single most recent Vitals document | P0 |
| FR-VR02 | `GET /api/vitals/history` must return the last 100 records sorted by timestamp descending | P0 |
| FR-VR03 | History endpoint must accept optional `limit` query parameter (max 1000) | P1 |
| FR-VR04 | History endpoint must accept optional `from` and `to` ISO timestamp query parameters for range queries | P2 |
| FR-VR05 | Both endpoints must return an empty result gracefully if no data exists | P0 |

### 8.3 Event Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-E01 | System must accept POST requests to `/api/events` with type field | P0 |
| FR-E02 | type must be one of: "iv_start" or "iv_stop" | P0 |
| FR-E03 | iv_start events must trigger the Drug Impact Curve computation asynchronously | P0 |
| FR-E04 | The POST response must not wait for Drug Impact Curve computation to complete | P0 |
| FR-E05 | All events must be persisted to MongoDB with a server-assigned timestamp if not provided | P0 |

### 8.4 Alert Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A01 | Alert engine must evaluate every incoming vitals record automatically | P0 |
| FR-A02 | SpO₂ below 90 must generate a critical severity alert | P0 |
| FR-A03 | SpO₂ between 90 and 93 (inclusive) must generate a warning severity alert | P0 |
| FR-A04 | Heart rate above 120 bpm must generate a warning severity alert | P0 |
| FR-A05 | Heart rate below 50 bpm must generate a warning severity alert | P0 |
| FR-A06 | IV status transitioning to "stopped" must generate an info severity alert | P1 |
| FR-A07 | No duplicate alerts may be generated for the same condition within a 5-minute window | P0 |
| FR-A08 | Duplicate prevention must use a hash of alert type and 5-minute time bucket | P0 |
| FR-A09 | All generated alerts must be persisted to MongoDB | P0 |
| FR-A10 | Generated alerts must be emitted immediately via Socket.io on the `alert:new` event | P0 |
| FR-A11 | `GET /api/alerts` must return all unacknowledged alerts sorted by timestamp descending | P0 |

### 8.5 Drug Impact Curve

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-D01 | On each iv_start event, the system must fetch vitals recorded in the 10 minutes prior as the baseline | P0 |
| FR-D02 | Baseline must be computed as the arithmetic mean of heartRate and spo2 across the pre-IV records | P0 |
| FR-D03 | System must track all vitals recorded in the 30 minutes following the iv_start timestamp | P0 |
| FR-D04 | Response delay must be defined as the first reading where spo2 improves by 2 or more points above baseline OR heartRate moves 5 or more points closer to 75 | P0 |
| FR-D05 | Improvement must be computed as the delta between post-IV mean and baseline for each vital | P0 |
| FR-D06 | Stabilisation time must be the earliest point where 5 consecutive readings have spo2 above 93 and heartRate between 55 and 100 | P0 |
| FR-D07 | If baseline data is unavailable (no pre-IV records), the service must return null for all computed values | P0 |
| FR-D08 | If stabilisation is not reached within 30 minutes, stabilisationMins must be null | P0 |
| FR-D09 | Computed result must be emitted on `insight:update` socket event | P0 |
| FR-D10 | `GET /api/insights` must return the most recently computed result | P0 |

### 8.6 AI Vision Service

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AI01 | FastAPI service must expose `POST /analyze-frame` accepting multipart/form-data | P0 |
| FR-AI02 | Input field name must be "frame" containing a JPEG or PNG image | P0 |
| FR-AI03 | Blood backflow detection must use HSV color segmentation targeting red hue ranges | P0 |
| FR-AI04 | Empty bottle detection must use brightness thresholding on the upper third of the frame | P0 |
| FR-AI05 | Air bubble detection must use OpenCV SimpleBlobDetector on grayscale frame | P1 |
| FR-AI06 | Response must be a JSON object with a "status" field containing one of: "normal", "backflow", "empty", "air_detected" | P0 |
| FR-AI07 | If an exception occurs during detection, service must return HTTP 200 with status "error" and a message field | P0 |
| FR-AI08 | Node.js backend must proxy frames to the AI service and not expose the AI service URL to the frontend | P0 |
| FR-AI09 | AI service URL must be configurable via environment variable | P0 |

### 8.7 Insight Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-I01 | System must generate a plain-English insight string from each Drug Impact Curve result | P0 |
| FR-I02 | If response delay is null: "No measurable response to IV administration detected within the observation window." | P0 |
| FR-I03 | If response delay exists and stabilisation is under 20 minutes: "Patient responded within X minutes. Vitals stabilised at Y minutes after IV start." | P0 |
| FR-I04 | If response delay exists and stabilisation is 20 minutes or more: "Patient showed initial response at X minutes but required extended time to stabilise (Y minutes)." | P0 |
| FR-I05 | If response delay exists and stabilisation is null: "Response detected at X minutes. Stabilisation not achieved within the 30-minute observation window." | P0 |
| FR-I06 | All minute values in insight strings must be rounded to one decimal place | P0 |
| FR-I07 | Insight string must always be a complete sentence ending with a period | P0 |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P01 | Vitals POST to socket emission latency | < 500ms at the server |
| NFR-P02 | End-to-end latency (sensor to dashboard render) | < 2 seconds, 95th percentile |
| NFR-P03 | Alert engine evaluation time per vitals record | < 100ms |
| NFR-P04 | AI service frame analysis response time | < 3 seconds per frame |
| NFR-P05 | Dashboard initial load time | < 3 seconds on a local network |
| NFR-P06 | MongoDB query time for history endpoint (100 records) | < 200ms |
| NFR-P07 | System must support at least 10 simultaneous WebSocket clients without performance degradation | Concurrent connections |

### 9.2 Reliability

| ID | Requirement |
|----|-------------|
| NFR-R01 | Backend must not crash if the AI service is offline. AI proxy calls must be wrapped in try/catch and return a graceful error. |
| NFR-R02 | Backend must not crash if MongoDB is temporarily unreachable. Connection retry logic must be implemented with exponential backoff. |
| NFR-R03 | Socket.io must be configured to attempt automatic reconnection on client disconnect. |
| NFR-R04 | Drug Impact Curve computation must not block the HTTP response for the iv_start event POST. |
| NFR-R05 | The system must handle malformed or missing sensor data without crashing the ingestion endpoint. |

### 9.3 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-M01 | Backend must follow MVC structure: routes are thin, all business logic lives in controllers and services. |
| NFR-M02 | Socket.io event wiring must be isolated in a dedicated sockets/ directory. |
| NFR-M03 | Alert threshold logic must live exclusively in alertService.js, not scattered across controllers or routes. |
| NFR-M04 | Drug curve computation must live exclusively in drugCurveService.js. |
| NFR-M05 | All configuration values (URLs, thresholds, ports) must be environment variables. No hardcoded values in source code. |
| NFR-M06 | Each source file must not exceed 150 lines. Files exceeding this limit must be refactored before merge. |

### 9.4 Scalability

| ID | Requirement |
|----|-------------|
| NFR-S01 | The three services (frontend, backend, AI service) must be independently deployable and scalable. |
| NFR-S02 | MongoDB indexes must be added on the timestamp field for Vitals and on the hash field for Alerts. |
| NFR-S03 | The architecture must support horizontal scaling of the backend by externalising Socket.io state to Redis in a future version (design must not prevent this). |

---

## 10. Data Requirements

### 10.1 Vitals Document

```
Field         Type      Required  Constraints
──────────────────────────────────────────────────────────────
_id           ObjectId  Auto      MongoDB generated
heartRate     Number    Yes       Range: 0–300
spo2          Number    Yes       Range: 0–100
ivStatus      String    Yes       Enum: "running", "stopped"
timestamp     Date      No        Defaults to server time on insert
```

### 10.2 Event Document

```
Field         Type      Required  Constraints
──────────────────────────────────────────────────────────────
_id           ObjectId  Auto      MongoDB generated
type          String    Yes       Enum: "iv_start", "iv_stop"
timestamp     Date      No        Defaults to server time on insert
metadata      Object    No        Defaults to {}
```

### 10.3 Alert Document

```
Field         Type      Required  Constraints
──────────────────────────────────────────────────────────────
_id           ObjectId  Auto      MongoDB generated
type          String    Yes       Free string, e.g. "LOW_SPO2"
message       String    Yes       Human-readable alert text
severity      String    Yes       Enum: "info", "warning", "critical"
acknowledged  Boolean   No        Defaults to false
hash          String    Yes       Unique index, SHA-256 of type+timeBucket
timestamp     Date      No        Defaults to server time on insert
```

### 10.4 Data Retention

- Vitals records: retain for 90 days by default (configurable via env variable)
- Alert records: retain for 12 months
- Event records: retain for 12 months
- Drug curve results: held in memory only in v1.0, persisted in v1.1

### 10.5 Indexes Required

```
Collection   Field        Index Type
────────────────────────────────────
vitals       timestamp    Ascending (for range queries and history)
vitals       ivStatus     Ascending (for IV transition detection)
alerts       hash         Unique (for deduplication)
alerts       acknowledged Ascending (for unacknowledged alert queries)
events       timestamp    Ascending
events       type         Ascending
```

---

## 11. API Specification

### 11.1 Base Configuration

```
Base URL:      http://<host>:5000
Content-Type:  application/json (all endpoints)
Auth:          None in v1.0 (added in v1.1)
```

### 11.2 Endpoints

#### POST /api/vitals

Ingest a vitals reading from the ESP32 sensor.

**Request body:**
```json
{
  "heartRate": 78,
  "spo2": 97,
  "ivStatus": "running",
  "timestamp": "2026-03-28T10:30:00Z"
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "heartRate": 78,
    "spo2": 97,
    "ivStatus": "running",
    "timestamp": "2026-03-28T10:30:00Z"
  }
}
```

**Error response (422):**
```json
{
  "success": false,
  "error": "heartRate must be a number between 0 and 300"
}
```

**Side effects:** Triggers alert engine evaluation. Emits `vitals:new` on Socket.io.

---

#### GET /api/vitals/latest

Returns the most recent vitals record.

**Query parameters:** None

**Success response (200):**
```json
{
  "success": true,
  "data": { ... vitals document ... }
}
```

---

#### GET /api/vitals/history

Returns historical vitals records.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 100 | Number of records to return (max 1000) |
| from | ISO string | — | Start of time range (inclusive) |
| to | ISO string | — | End of time range (inclusive) |

**Success response (200):**
```json
{
  "success": true,
  "count": 100,
  "data": [ ... array of vitals documents ... ]
}
```

---

#### POST /api/events

Record a clinical event (IV start or stop).

**Request body:**
```json
{
  "type": "iv_start",
  "timestamp": "2026-03-28T10:30:00Z",
  "metadata": {}
}
```

**Success response (201):**
```json
{
  "success": true,
  "data": { ... event document ... }
}
```

**Side effects on iv_start:** Triggers Drug Impact Curve computation asynchronously. Does not delay the response.

---

#### GET /api/alerts

Returns all unacknowledged alerts.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| severity | string | — | Filter by severity: info, warning, critical |
| limit | integer | 50 | Number of records to return |

**Success response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [ ... array of alert documents ... ]
}
```

---

#### GET /api/insights

Returns the most recently computed Drug Impact Curve result.

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "ivStartTime": "2026-03-28T10:30:00Z",
    "baseline": { "heartRate": 112, "spo2": 88 },
    "responseDelayMins": 4.5,
    "improvement": { "heartRate": -18, "spo2": 6 },
    "stabilizationMins": 12.0,
    "insight": "Patient responded within 4.5 minutes. Vitals stabilised at 12.0 minutes after IV start.",
    "vitalsTimeline": [ ... ]
  }
}
```

---

#### POST /api/analyze-frame (Backend AI Proxy)

Accepts an image frame and proxies it to the FastAPI AI service.

**Request:** multipart/form-data, field name: "frame", JPEG or PNG.

**Success response (200):**
```json
{
  "success": true,
  "data": {
    "status": "normal"
  }
}
```

**Possible status values:** "normal", "backflow", "empty", "air_detected", "error"

---

### 11.3 Socket.io Events

#### Server → Client events

| Event | Payload | Description |
|-------|---------|-------------|
| `vitals:new` | Full Vitals document | Emitted on every successful vitals ingestion |
| `alert:new` | Full Alert document | Emitted immediately when a new alert is created |
| `insight:update` | Full Drug Impact Curve result including insight string | Emitted when drug curve computation completes |
| `iv:vision` | `{ status: string }` | Emitted when AI frame analysis returns a result |

#### Client → Server events

None defined in v1.0. Bidirectional capability reserved for v1.1 (acknowledge alert from dashboard).

---

## 12. Feature Specifications

### 12.1 Feature: Real-Time Vitals Dashboard

**Description:** The primary dashboard view shows the current state of a monitored patient in real-time.

**Acceptance criteria:**
- Heart Rate card displays the most recent heartRate value, updated within 2 seconds of each sensor reading
- SpO₂ card displays the most recent spo2 value with the same latency requirement
- IV Status badge shows "Running" in green or "Stopped" in red, reflecting the most recent ivStatus
- Both chart panels (Time vs Heart Rate, Time vs SpO₂) render as line charts with the last 100 data points
- Charts scroll or extend rightward as new data arrives; they do not reset
- If the WebSocket connection drops, the UI shows a "Reconnecting..." indicator and resumes automatically on reconnect
- On initial load, history is fetched from `GET /api/vitals/history` so charts are populated before any real-time data arrives

**Out of scope for this feature:** Multi-patient view, chart zoom, chart export.

---

### 12.2 Feature: Alert Panel

**Description:** A scrollable panel on the dashboard listing recent clinical alerts in reverse chronological order.

**Acceptance criteria:**
- Critical severity alerts display with a red background or indicator
- Warning severity alerts display with an amber background or indicator
- Info severity alerts display with a grey background or indicator
- Each alert shows: severity label, message text, and timestamp
- New alerts appear at the top of the list without requiring a page refresh
- On initial load, unacknowledged alerts are fetched from `GET /api/alerts`
- The panel shows the 50 most recent unacknowledged alerts; older ones are not shown (pagination deferred to v1.1)

---

### 12.3 Feature: Drug Impact Curve

**Description:** A dedicated chart section that plots patient vitals relative to an IV start event, with the IV event highlighted and a plain-language insight displayed above the chart.

**Acceptance criteria:**
- Chart renders only after an iv_start event has been received and the 30-minute window has closed
- IV start time is marked with a vertical reference line on the chart
- Pre-IV vitals (up to 10 minutes prior) are plotted to the left of the reference line
- Post-IV vitals (up to 30 minutes after) are plotted to the right
- Both heart rate and SpO₂ are plotted as separate lines on the same time axis
- The insight string is displayed as a banner above the chart
- If no drug curve data is available, the section shows "No IV event recorded in this session"
- The chart updates automatically when `insight:update` is received via Socket.io

---

### 12.4 Feature: IV Vision Panel

**Description:** A status panel showing the result of the most recent AI analysis of the IV camera frame.

**Acceptance criteria:**
- Panel shows one of four states: Normal, Backflow Detected, Bottle Empty, Air Detected
- State updates each time the backend receives and processes a new frame
- If the AI service is offline or returns an error, the panel shows "Vision service unavailable" and does not crash the dashboard
- Normal state is shown in green, all anomaly states are shown in red or amber

---

## 13. User Interface Requirements

### 13.1 Layout

The dashboard uses a single-page layout with the following grid structure:

```
┌─────────────────────────────────────────────────────┐
│  Header: Patient Name / Room / Connection Status    │
├──────────────┬──────────────┬───────────────────────┤
│  Heart Rate  │    SpO₂      │   IV Status Badge     │
│     Card     │    Card      │   IV Vision Panel     │
├──────────────┴──────────────┴───────────────────────┤
│              Vitals Charts (HR + SpO₂)              │
├─────────────────────────────┬───────────────────────┤
│   Drug Impact Curve Chart   │    Alert Panel        │
│   + Insight Banner          │                       │
└─────────────────────────────┴───────────────────────┘
```

### 13.2 Design Principles

- The UI must be legible at 2 metres distance (minimum font size 14px for all data values, 18px or larger for primary vital readings)
- Color must not be the only indicator of severity — severity labels must always accompany color coding (for accessibility)
- Dark mode is preferred for clinical environments where screens are on continuously
- No animation on data updates except for new alert appearance (brief slide-in)
- No splash screens, loading spinners for individual cards (show last known value while loading)

### 13.3 Component Inventory

| Component | File | Responsibility |
|-----------|------|----------------|
| App | `App.jsx` | Root, socket init, top-level state |
| Dashboard | `Dashboard.jsx` | Grid layout, composes all panels |
| VitalsCard | `VitalsCard.jsx` | Single vital display (HR or SpO₂) |
| IVStatusBadge | `IVStatusBadge.jsx` | Running/stopped indicator |
| IVVisionPanel | `IVVisionPanel.jsx` | AI detection status display |
| VitalsChart | `VitalsChart.jsx` | Recharts line chart, dual line |
| DrugCurveChart | `DrugCurveChart.jsx` | Impact chart with reference line |
| InsightBanner | `InsightBanner.jsx` | Plain-text insight display |
| AlertPanel | `AlertPanel.jsx` | Scrollable alert list |

### 13.4 Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| useSocket | `hooks/useSocket.js` | Socket.io connection lifecycle and event subscriptions |
| useVitals | `hooks/useVitals.js` | Initial history fetch and real-time state merge |

---

## 14. Integration Requirements

### 14.1 ESP32 Sensor Integration

The ESP32 firmware (not in scope for this PRD to specify in full) must satisfy these requirements for the backend to accept its data:

- Must send HTTP POST requests to `http://<backend-host>:5000/api/vitals`
- Payload must be valid JSON with Content-Type: application/json header
- Fields: heartRate (integer), spo2 (integer), ivStatus ("running" or "stopped"), timestamp (ISO 8601 string)
- Recommended polling interval: 2 seconds
- Must handle HTTP 4xx and 5xx responses gracefully and retry on 5xx

### 14.2 ESP32-CAM Integration

- Must send HTTP POST requests to `http://<backend-host>:5000/api/analyze-frame`
- Must use multipart/form-data with field name "frame"
- Image format: JPEG preferred, PNG accepted
- Recommended frame capture interval: every 5 seconds
- Must handle AI service unavailability gracefully (backend returns 200 with status "error")

### 14.3 Service-to-Service Communication

- Node.js backend to FastAPI AI service: HTTP POST via axios, multipart/form-data
- AI service URL configurable via `AI_SERVICE_URL` environment variable
- Backend must set a 5-second timeout on AI service calls
- Backend must not retry failed AI service calls automatically in v1.0

### 14.4 Environment Configuration

**Backend (.env):**
```
MONGO_URI=mongodb://localhost:27017/iot_health
PORT=5000
AI_SERVICE_URL=http://localhost:8000
SOCKET_CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000
```

**AI service:** No environment variables required in v1.0.

---

## 15. Alert and Notification System

### 15.1 Alert Thresholds

| Condition | Severity | Alert Type ID | Message Template |
|-----------|----------|---------------|------------------|
| SpO₂ < 90% | Critical | LOW_SPO2_CRITICAL | "Critical: SpO₂ has dropped to {value}%. Immediate assessment required." |
| SpO₂ 90–93% | Warning | LOW_SPO2_WARNING | "Warning: SpO₂ is {value}%, below normal range. Monitor closely." |
| Heart rate > 120 bpm | Warning | HIGH_HR | "Warning: Tachycardia detected. Heart rate is {value} bpm." |
| Heart rate < 50 bpm | Warning | LOW_HR | "Warning: Bradycardia detected. Heart rate is {value} bpm." |
| IV status → stopped | Info | IV_STOPPED | "IV administration has stopped. Monitor patient for response changes." |

### 15.2 Deduplication Logic

```
timeBucket = Math.floor(Date.now() / 300_000)   // 5-minute window
hash = SHA256(alertType + timeBucket)

Before creating an alert:
  1. Query alerts collection for existing document with this hash
  2. If found: suppress the new alert, do not insert, do not emit
  3. If not found: insert the alert, emit via Socket.io
```

### 15.3 Alert Lifecycle

```
Created → Stored in MongoDB (acknowledged: false)
        → Emitted via Socket.io (alert:new)
        → Displayed in Alert Panel

Acknowledged → acknowledged field set to true (v1.1 feature)
             → Removed from default GET /api/alerts response
```

---

## 16. Security and Compliance

### 16.1 Version 1.0 Security Posture

Version 1.0 is designed for a closed, trusted hospital network. It does not implement authentication. The following represents the minimum security baseline for v1.0 deployment:

| Control | Requirement |
|---------|-------------|
| Network isolation | Backend must not be exposed to the public internet. Deploy within hospital LAN or VPN only. |
| CORS | CORS origin must be set to the specific frontend origin, not wildcard (*). |
| Environment secrets | MongoDB URI and all credentials must be in environment variables, never in source code or version control. |
| Input validation | All incoming JSON payloads must be validated before processing. |
| Error responses | Error responses must not expose stack traces, file paths, or internal implementation details. |
| Dependency audit | Run `npm audit` and `pip audit` before any deployment. No high or critical CVEs in direct dependencies. |

### 16.2 Version 1.1 Security Requirements (Planned)

- JWT authentication for all API endpoints
- Role-based access: nurse view vs. physician view vs. admin
- HTTPS with TLS 1.2 minimum on the backend
- Session expiry after 8 hours (one shift)
- Audit log of all alert acknowledgements with user ID and timestamp

### 16.3 Data Privacy

- In v1.0, the system does not store patient identity. Vitals records are not linked to a named patient.
- Patient identification is a v1.1 requirement and will require a privacy impact assessment before implementation.
- Camera frames are processed in memory and not stored on disk by the AI service.

### 16.4 Clinical Disclaimer

This system is a monitoring aid for use by qualified clinical staff. It does not constitute a medical device under regulatory frameworks in v1.0. All alerts are advisory. Clinical staff must exercise independent judgment. The system must not be used as a substitute for clinical assessment.

---

## 17. Release Phases and Milestones

### 17.1 Phase Overview

| Phase | Name | Scope | Target Duration |
|-------|------|-------|-----------------|
| Phase 1 | Project Setup | Scaffold, environment, all three services running | 1 day |
| Phase 2 | Backend Core API | Schemas, controllers, routes, error handling | 2 days |
| Phase 3 | Real-Time Layer | Socket.io integration, vitals and alert events | 1 day |
| Phase 4 | Frontend Dashboard | React UI, charts, Socket.io client | 3 days |
| Phase 5 | Alert System | Threshold logic, deduplication, alert panel | 2 days |
| Phase 6 | Drug Impact Curve | Backend computation, frontend chart | 2 days |
| Phase 7 | AI Camera Module | FastAPI service, OpenCV detection, proxy | 2 days |
| Phase 8 | Insight Generation | Plain-language insight from curve data | 1 day |
| Phase 9 | Integration & QA | End-to-end verification, bug fixes, documentation | 2 days |

**Total estimated build time:** 16 working days

### 17.2 Acceptance Criteria for v1.0 Completion

All of the following must be true before v1.0 is considered complete:

- [ ] POST /api/vitals with a valid payload results in dashboard update within 2 seconds
- [ ] POST /api/vitals with SpO₂ = 88 results in a critical alert appearing in the alert panel
- [ ] POST /api/vitals with SpO₂ = 88 submitted twice within 5 minutes results in only one alert
- [ ] POST /api/events with type "iv_start" results in the Drug Impact Curve chart rendering after the 30-minute window
- [ ] POST /ai/analyze-frame with a test image returns a valid status and updates the IV vision panel
- [ ] Shutting down the FastAPI service results in the backend returning status "error" without crashing
- [ ] Disconnecting the Socket.io client results in automatic reconnection within 10 seconds
- [ ] All three services start with only `npm run dev` (backend), `npm run dev` (frontend), and `uvicorn main:app --reload` (AI service)

---

## 18. Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|-----------|
| R01 | ESP32 network instability causes gaps in vitals data | Medium | High | Design backend to accept late-arriving timestamps; display "last updated" time on dashboard |
| R02 | OpenCV detection produces false positives on IV camera | Medium | Medium | Add confidence threshold to detection; allow staff to dismiss false positive from dashboard (v1.1) |
| R03 | Alert fatigue from low thresholds | High | Medium | 5-minute deduplication window; clinical advisor validates thresholds before deployment |
| R04 | Drug curve 30-minute window too short for slow-acting drugs | Medium | Medium | Make window duration configurable via environment variable; default 30 minutes |
| R05 | MongoDB disk space grows unbounded | Low | High | Implement TTL index on vitals collection (90 days) before first production deployment |
| R06 | Socket.io does not scale across multiple backend instances | Low | High | Document Redis adapter requirement for horizontal scaling; single instance for v1.0 |
| R07 | AI service cannot keep up with frame rate | Low | Medium | Frame capture interval set to 5 seconds; AI service processes one frame at a time; queue not required at this rate |
| R08 | Clinical staff distrust automated insights | High | Medium | Label all AI-generated content as advisory; include raw data alongside insight strings; clinical advisor reviews wording |

---

## 19. Open Questions

| ID | Question | Owner | Target Resolution |
|----|----------|-------|-------------------|
| OQ01 | Should the Drug Impact Curve window be fixed at 30 minutes or configurable per drug type? | Clinical Advisor + Product | Before Phase 6 starts |
| OQ02 | What is the correct SpO₂ warning threshold? 90–93% assumes standard monitoring guidelines — does the clinical team agree? | Clinical Advisor | Before Phase 5 starts |
| OQ03 | Should acknowledged alerts be permanently removed from the API response or soft-deleted with a filter option? | Product | Before Phase 5 starts |
| OQ04 | Does the hospital network support multicast? (Affects Socket.io scaling decision) | DevOps | Before Phase 9 |
| OQ05 | Is the ESP32-CAM resolution sufficient for air bubble detection? Minimum bubble size may be below pixel threshold at standard resolution. | IoT Team | Before Phase 7 starts |
| OQ06 | Should the insight string be stored in MongoDB for audit purposes or remain in memory only? | Product | Before Phase 8 starts |
| OQ07 | What is the patient identification scheme for v1.1? Room number, bed number, hospital ID? | Clinical Advisor + Compliance | v1.1 planning |

---

## 20. Appendix

### 20.1 Glossary

| Term | Definition |
|------|-----------|
| SpO₂ | Peripheral oxygen saturation. Measured as a percentage. Normal range is 95–100%. |
| Tachycardia | Heart rate above 100 bpm. The alert threshold in this system is set at 120 bpm. |
| Bradycardia | Heart rate below 60 bpm. The alert threshold in this system is set at 50 bpm. |
| IV / IV drip | Intravenous administration of fluids or medication directly into a vein. |
| Blood backflow | Condition where blood flows backward into the IV line, visible as red discoloration in the tubing. Indicates a pressure problem. |
| Drug Impact Curve | This system's name for the feature that correlates IV start events with subsequent changes in patient vitals. |
| Response delay | The time between IV administration start and the first measurable improvement in vitals as defined in FR-D04. |
| Stabilisation time | The time between IV administration start and the point where vitals remain within normal range for 5 consecutive readings. |
| Alert fatigue | The phenomenon where clinical staff begin ignoring or dismissing alerts because too many are generated, including irrelevant ones. |
| ESP32 | A low-cost, low-power microcontroller with integrated Wi-Fi and Bluetooth, used here as the sensor node. |
| ESP32-CAM | A variant of the ESP32 with an integrated camera module, used here for IV line monitoring. |
| MVC | Model-View-Controller. An architectural pattern that separates data models, business logic, and presentation. Used to structure the Express backend. |
| Socket.io | A JavaScript library that enables real-time, bidirectional communication between a browser and a server over WebSocket with automatic fallback. |
| HSV | Hue-Saturation-Value. A color representation used in OpenCV for color-based image segmentation. Preferred over RGB for detecting specific colors under varying lighting. |
| TTL index | Time-to-live index in MongoDB. Automatically removes documents after a specified period. Used for vitals data retention. |

### 20.2 Related Documents

- IoT Healthcare Monitoring System — Technical Architecture Document (v1.0)
- IoT Healthcare Monitoring System — Cursor IDE Prompt Playbook (9 phases)
- ESP32 Firmware Specification (IoT Team, separate document)
- Network Topology and Deployment Guide (DevOps, to be written before Phase 9)

### 20.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | March 2026 | Engineering Lead | Initial draft |
| 1.0 | March 2026 | Engineering Lead | First complete version, all sections filled |

---

*End of Document — IoT Healthcare Monitoring System PRD v1.0*
