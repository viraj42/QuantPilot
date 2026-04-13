<div align="center">

# 🚀 Aptify
**The Next-Generation AI-Powered Aptitude & Quantitative Preparation Platform**

Aptify (formerly QuantPilotAI) is an elite, full-stack learning and assessment ecosystem. It moves beyond traditional static question banks by harnessing advanced AI architectures (Anthropic/Groq) to generate dynamic, adaptive, and highly focused quantitative challenges in real-time.

[Live Demo](#) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 📖 Executive Summary
Aptify transforms how aspirational professionals prepare for rigorous quantitative assessments. Built entirely on the MERN stack with highly optimized MongoDB aggregation pipelines and an elite, modern UI/UX, the platform guarantees that users never see the same question twice while progressing through a deterministically structured curriculum roadmap.

### 🎭 Demo Credentials
Want to experience the platform? Use the following credentials:
- **Email:** `demo.learner@example.com`
- **Password:** `Demo@1234`

---

## ✨ Core Features Engine

### 1. Dynamic AI Practice Engine
Unlike legacy platforms using static databases, Aptify generates content synchronously:
- **Topic-Specific Generation:** Synthesizes unique problems strictly bounded by user-selected topics.
- **Mathematical Rendering:** Integrates `KaTeX` natively into the frontend to cleanly parse and render complex AI-generated mathematical formulas and equations.
- **Progressive Difficulty Targeting:** Adjusts constraints seamlessly to bridge conceptual gaps as the user progresses.

### 2. High-Stakes Mock Assessments
Replicates the pressure of real-world testing environments:
- **Stateful Assessment Cycles:** Highly monitored, timed environments enforcing integrity constraints (`MockAttempt` tracking).
- **Customizable Configurations:** Dynamically assembles domains based on `MockConfig` models, assigning relative weighting to logical, verbal, and quantitative sections.
- **Intelligent Evaluation:** End-of-test evaluations score attempts dynamically against global percentiles rather than flat accuracy.

### 3. Deep Telemetry & Analytics Dashboard
Aptify doesn't just track right or wrong; it visualizes learning behavior:
- **Github-Style Heatmaps:** Records daily micro-interactions utilizing scalable `UserActivity` documents, translated into visual density maps without database bloat.
- **Multi-Axis Performance Radars:** Powered by `Chart.js`, breaking down conceptual capability across disparate syllabus branches.
- **Granular Exposure Tracking:** Differentiates between unique question exposure rates versus total attempted numbers, identifying plateau points.

---

## 🏗️ Technical Architecture

<details>
<summary><b>Frontend Ecosystem (React 19 / Vite)</b></summary>
<br>

Designed for extreme aesthetic fidelity and instantaneous interactivity.
- **Glassmorphic UI:** Built with `TailwindCSS v4` utilizing modern compositing and blur filters for a deeply premium dark mode experience.
- **Micro-Animations:** Heavy reliance on `Framer Motion` to orchestrate 60fps state transitions, modal appearances, and routing shifts.
- **Data Visualization:** Heavily customized `react-chartjs-2` wrappers providing responsive, accessible analytics.
- **State Management:** Contextual wrappers gracefully preventing prop-drilling while managing active mock states and AI parsing flags.
</details>

<details>
<summary><b>Backend Services (Node.js / Express)</b></summary>
<br>

Engineered for stateless integrity, security, and agnostic API scaling.
- **Thin Controllers & API-First Design:** Strict MVC adherence separating route handling from underlying business execution.
- **LLM Agnostic Interface:** Built to seamlessly hot-swap between multiple AI providers (currently supporting `@anthropic-ai/sdk` and `groq-sdk`) using modular utility handlers.
- **Stateless Authorization:** Hardened JWT pipelines validating token integrity with zero database lookups per request.

</details>

<details>
<summary><b>Database & Schema Design (MongoDB / Mongoose)</b></summary>
<br>

Optimized for extremely heavy read/write metrics without incurring scaling penalties.
- **Deterministic Curriculum Tree:** `Section` and `Topic` collections act as immutable roadmaps governing user progression.
- **Time-Series Optimization:** `UserActivity` logs use aggregated date constraints avoiding redundant multi-document insertions for identical daily events.
- **Relational Simulators:** Aggregation pipelines intelligently joining `Attempt`, `User`, and `Topic` collections to compute advanced percentile rankings in single trips.
</details>

---

## 🔐 Security & Authorization Posture
1. **Bcrypt Hashing:** Zero-knowledge password footprint enforced at schema save-hooks.
2. **Refresh Token Rotation:** Independent `RefreshToken` model allowing prolonged secure sessions without compromising short-lived access JWTs.
3. **Route Middlewares:** Centralized `protect` handlers rejecting unauthorized requests long before they reach controller logic.
4. **Input Sanitization:** Payload validation ensuring deterministic data entry using `express-validator`.

---

## 🚀 Local Development Setup

Follow these steps to run Aptify locally.

### 1. Repository Initialization
```bash
git clone <your-repository-url>
cd QuantPilotAI/QuantPilot
```

### 2. Backend Orchestration
Open a terminal and navigate to the backend directory:
```bash
cd Backend
npm install
```
Create a `.env` file containing the necessary secrets:
```env
PORT=8080
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/aptify
JWT_SECRET=your_super_secret_jwt_key
ANTHROPIC_API_KEY=sk-ant-api03...
GROQ_API_KEY=gsk_...
```
Initialize the server:
```bash
npm run dev
```

### 3. Frontend Orchestration
Open a new terminal and navigate to the frontend application:
```bash
cd Frontend/my-app
npm install
```
Configure your frontend environment by creating an `.env` file:
```env
VITE_API_URL=http://localhost:8080/api
```
Bootstrap the Vite development server:
```bash
npm run dev
```

---

## 🎯 Architectural Philosophy & Outcomes
Aptify proves the viability of using generative modeling to completely replace static test banks in educational technology. Through modular abstraction and interview-grade systems design, the project achieves an intricate balance between:
- **Unpredictability** (via real-time AI modeling) 
- **Explainability** (via deterministic tracking, isolated schemas, and analytics pipelines).

---

## 🛣️ Roadmap
- [ ] **Peer vs. Peer Arena:** Implement WebSockets (`Socket.io`) for live 1v1 quantitative sprint battles.
- [ ] **Redis Caching Node:** Deploy intermediate data caches for high-frequency syllabus requests.
- [ ] **Extended LLM Agents:** Build "Tutor Agents" providing multi-step conversational debriefings on missed questions.
