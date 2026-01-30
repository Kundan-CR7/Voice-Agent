# Real-Time Voice Agent 🎙️

A production-grade, real-time voice assistant built with React and Node.js. The agent features low-latency speech interaction, custom Voice Activity Detection (VAD), barge-in capability, and integration with Deepgram (STT/TTS), OpenRouter (LLM), and Tavily (Search).

## Live Demo

Hosted application:  
https://voice-agent-bice.vercel.app/

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-green.svg)

### Key Components
1. **Frontend Audio Processing**: Uses `AudioWorklet` to capture raw PCM audio (Float32) and stream it to the backend via WebSocket. It also handles audio playback of the agent's response.
2. **Backend VAD**: Monitors the Root Mean Square (RMS) amplitude of incoming audio frames.
   - `RMS > Threshold`: Speech Start.
   - `Silence > Duration`: Speech End (Trigger Turn).
3. **Session Management**: In-memory `Map` stores user state, conversation history, and audio buffers.

---

## ⚡ Deployment & Setup

### Prerequisites
- Node.js v18+
- API Keys for: Deepgram, OpenRouter, Tavily.

### 1. Clone & Install
```bash
git clone https://github.com/Kundan-CR7/Voice-Agent
cd voice-agent
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
# Ensure VITE_HOSTED_URL=ws://localhost:3000
```

### 4. Run Locally
Start the backend:
```bash
# Terminal 1 (backend)
npm start
```
Start the frontend:
```bash
# Terminal 2 (frontend)
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## 🚀 Features
- **Real-Time Usage**: Low-latency full-duplex conversation.
- **Custom VAD**: RMS-based Voice Activity Detection with tunable thresholds.
- **Barge-In**: Users can interrupt the agent at any time.
- **Dynamic Context**: Web search integration for real-time information.
- **Metrics Dashboard**: Real-time visualization of STT, LLM, and TTS latencies.
- **Visuals**: Reactive audio waveform and immersive UI.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, AudioWorklet.
- **Backend**: Node.js, Express, WebSocket (`ws`).
- **AI/ML Services**:
  - **STT**: Deepgram Nova-2
  - **LLM**: OpenRouter (Mistral 7B Instruct)
  - **TTS**: Deepgram Aura
  - **Search**: Tavily API

---

## 🏗️ Architecture

The system uses a WebSocket-based event-driven architecture to handle audio streaming and state management.

```mermaid
graph TD
    User([User]) <-->|Microphone/Speaker| Frontend[Frontend (React)]
    Frontend <-->|WebSocket (Audio/Data)| Backend[Backend (Node.js/Express)]
    
    subgraph Connection
        Frontend -- Audio Stream (Float32) --> Backend
        Backend -- Audio Stream (Int16) --> Frontend
    end

    subgraph Backend_Pipeline
        VAD[Custom VAD (RMS)]
        Buffer[Audio Buffer]
        
        VAD -->|Speech Start| Buffer
        Buffer -->|Silence Detected| STT[Deepgram STT]
        STT -->|Transcript| LLM_Orchestrator[LLM Orchestrator]
        
        LLM_Orchestrator -.->|Query| Search[Tavily Search]
        Search -.->|Context| LLM_Orchestrator
        
        LLM_Orchestrator -->|Prompt + Context| LLM[OpenRouter (Mistral)]
        LLM -->|Text Response| TTS[Deepgram TTS]
    end
    
    TTS -->|Audio Buffer| Backend
```

## 🧩 Design Decisions

### Provider & Technology Choices
- **Deepgram** was chosen for fast and reliable STT/TTS suitable for turn-based voice pipelines.
- **OpenRouter (Mistral 7B)** provides low-latency inference with streaming support for TTFT measurement.
- **Tavily** enables quick retrieval of real-time external information with minimal prompt overhead.
- **WebSockets** were used for persistent, bi-directional communication with low latency.
- **AudioWorklet** allows raw audio access on the client for fine-grained control and minimal delay.

---

### Real-Time Communication
- Audio is streamed as raw PCM frames from client to server over WebSockets.
- Control events (state, transcripts, metrics) share the same connection to reduce synchronization overhead.
- Agent audio is streamed back immediately and can be interrupted (barge-in) on new speech detection.

---

### Performance Optimization
- Lightweight RMS-based VAD avoids heavy DSP and reduces CPU overhead.
- Turn-based STT invocation minimizes unnecessary processing and cost.
- Streaming LLM responses enable early token handling and TTFT measurement.
- Client-side barge-in stops playback instantly without server round-trips.

---

### Custom Audio Processing
- **Noise Suppression**: RMS thresholding filters low-energy background noise.
- **VAD**: Speech is detected using amplitude thresholds and minimum frame counts.
- **Turn Detection**: End-of-turn is identified using silence duration heuristics.
- **Barge-In**: Active agent playback is stopped immediately on user speech.


## ⚡ Performance Analysis

The system is optimized for low-latency, natural voice interactions by minimizing
processing overhead at each stage of the voice pipeline.

### Achieving Low Latency
- **Client-side AudioWorklet** enables immediate audio capture without blocking the UI.
- **Lightweight RMS-based VAD** avoids heavy DSP while reliably detecting speech boundaries.
- **Turn-based STT invocation** reduces unnecessary transcription calls.
- **Streaming LLM responses** allow early token generation and TTFT measurement.
- **Client-side barge-in handling** stops agent playback instantly without server round-trips.

---

### Measured Performance (Local Testing)

Based on live observability metrics (see screenshot above):

- **VAD Detection Latency**: ~607 ms  
- **STT Latency**: ~496 ms  
- **LLM Latency**: ~884 ms  
- **LLM TTFT**: ~403 ms  
- **TTS Latency**: ~421 ms  
- **End-to-End (E2E) Latency**: ~1.8 seconds  

> E2E latency is measured from end-of-speech (VAD trigger) to the start of audio playback.

These values consistently meet the target of sub-2 second conversational response time.

---

### Bottlenecks & Mitigations

- **VAD Silence Window**:  
  A ~600 ms silence threshold was chosen to balance responsiveness and natural pauses.
  Lower values caused premature turn cuts; higher values increased perceived delay.

- **LLM Response Time**:  
  LLM latency is the dominant contributor to E2E time. This was mitigated by using a
  fast, lightweight model (Mistral 7B) with streaming enabled.

- **Audio Processing Overhead**:  
  Audio buffer aggregation is CPU-bound. Keeping the processing lightweight and
  in-memory prevents it from becoming a bottleneck during concurrent sessions.

Future improvements include streaming LLM tokens directly into TTS to further
reduce end-to-end latency.


## 📈 Scalability Considerations

### Concurrent Users
- Each user session is handled via an independent WebSocket connection.
- Session state (audio buffers, VAD state, conversation context) is isolated per user
  using an in-memory session map, preventing context bleed.
- The non-blocking Node.js event loop allows multiple concurrent voice sessions
  within a single process.

---

### Scaling to 10× / 100× Users
- **Session State**: Move in-memory session data to a shared store (e.g., Redis)
  to support horizontal scaling across multiple backend instances.
- **WebSocket Scaling**: Use sticky sessions or a pub/sub layer (Redis, NATS)
  to route messages correctly in multi-instance deployments.
- **Audio Processing**: Offload CPU-bound audio processing (buffer aggregation,
  WAV creation) to worker threads or separate services.
- **Deployment**: Add horizontal autoscaling behind a load balancer.

---

### Resource Efficiency
- Lightweight RMS-based audio processing minimizes CPU overhead.
- Turn-based STT invocation avoids unnecessary transcription calls and reduces cost.
- In-memory session handling avoids disk I/O during active conversations.
- Single WebSocket connection per user minimizes networking overhead.

## ⚖️ Tradeoffs & Future Work

### Tradeoffs
- Optimized for **low latency and system simplicity** over heavy DSP or complex orchestration.
- Chose **lightweight RMS-based audio processing** instead of advanced noise suppression to reduce CPU overhead.
- Used **in-memory session state** for fast access at the cost of durability across restarts.
- Prioritized a **single primary provider** per STT/LLM/TTS to keep the pipeline stable and debuggable.

---

### Known Limitations
- No provider fallback if an external STT, LLM, or TTS service becomes unavailable.
- Conversation memory is not backed by a durable database.
- LLM output is generated before TTS, adding some end-to-end latency.
- Audio processing is CPU-bound and may become a bottleneck at high concurrency.

---

### Future Work
- Add provider fallback for STT, LLM, and TTS.
- Stream LLM tokens directly into TTS to reduce response latency.
- Persist sessions and conversation history using Redis or a database.
- Implement semantic caching for repeated or similar queries.
- Improve noise suppression using more advanced signal processing techniques.




