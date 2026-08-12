# FluentAI AI Gateway

A standalone, stateless FastAPI microservice built to handle the AI dialog logic, translation, and speech quality evaluation for the **FluentAI Language Mentor** platform.

---

## 🚀 Overview

The AI Gateway coordinates interactions with external LLM providers (OpenAI, Gemini, Claude/Anthropic, and local Ollama instances) using a unified provider abstraction. 

### Key Characteristics
1. **Stateless**: No database or persistence layers. Session storage and history remain in the main Node.js/PostgreSQL backend.
2. **Internal-Only Access**: Exposes only internal endpoints `/internal/*`. It **must have no public ingress** and is accessible only from the Node.js backend using a shared-secret header (`X-Internal-Key`).
3. **Voice-Loop Latency Constraint**: In order to satisfy the voice round-trip target (< ~3s), the `/internal/converse` endpoint completes natural conversation generation, grammar error extraction, corrections, and avatar emotion tagging in a **single turn, single LLM call**.

---

## 📂 Project Structure

```text
ai-gateway/
├── app/
│   ├── api/
│   │   ├── converse.py         # POST /internal/converse
│   │   ├── health.py           # GET /internal/health
│   │   ├── pronunciation.py    # POST /internal/pronunciation (Async placeholder)
│   │   └── translate.py        # POST /internal/translate
│   │
│   ├── core/
│   │   ├── config.py           # Pydantic Settings & fail-fast startup checks
│   │   ├── exceptions.py       # Global exception filters & Pydantic error formatter
│   │   ├── logging.py          # Request-ID tracking Console Logger
│   │   └── middleware.py       # Trace ID injector & X-Internal-Key Auth check
│   │
│   ├── providers/
│   │   ├── base_provider.py    # Abstract base LLM provider interface
│   │   ├── openai_provider.py  # GPT-4o-mini async implementation
│   │   ├── gemini_provider.py  # Gemini-1.5-flash async implementation
│   │   ├── ollama_provider.py  # Local Llama3 async HTTP implementation
│   │   └── anthropic_provider.py # Claude-3-5-Sonnet async implementation
│   │
│   ├── services/
│   │   ├── llm_router.py       # Selection router for active LLM provider
│   │   ├── converse_service.py # Prompt builder, LLM query, & JSON parser
│   │   ├── avatar_service.py   # Emotion-to-blend-shapes lookup mapping
│   │   ├── translation_service.py # Provider-agnostic translation logic
│   │   └── pronunciation_service.py # Async pronunciation evaluation interface
│   │
│   ├── utils/
│   │   ├── helpers.py          # Regex markdown JSON extractor & string cleaners
│   │   └── request_id.py       # Thread-safe context var for request tracing
│   │
│   └── main.py                 # Core application bootstrap
│
├── Dockerfile                  # Slim production multi-layer builder
├── docker-compose.yml          # Container configuration orchestrator
├── requirements.txt            # Package dependencies manifest
└── .env.example                # Configuration blueprint
```

---

## 🛠️ Local Startup & Installation

### Option 1: Running Locally (Virtual Environment)
Ensure you have **Python 3.12** installed on your system.

1. **Navigate to the AI Gateway directory:**
   ```bash
   cd ai-gateway
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Set up configurations:**
   ```bash
   cp .env.example .env
   # Open .env and populate your keys, e.g. INTERNAL_API_KEY, OPENAI_API_KEY, etc.
   ```

5. **Run the service using Uvicorn:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
   ```

### Option 2: Running via Docker Compose
1. Make sure Docker and Docker Compose are installed.
2. Verify that a `.env` file exists inside the `ai-gateway/` folder.
3. Boot the container:
   ```bash
   docker compose up --build -d
   ```

---

## 🔒 Security & Deployment Ingress

- **Internal Authentication**: Every API request to `/internal/*` (except `/internal/health`) must contain the header `X-Internal-Key` with a value matching the `INTERNAL_API_KEY` defined in the `.env` file. If missing or incorrect, a `401 Unauthorized` JSON payload is returned.
- **No Public Ingress**: In production environments, this gateway **must not be exposed to the public internet**. Load balancers or API Gateways must configure routing tables such that `/internal` paths are blocked from external clients, ensuring the microservice is reachable only within the internal container network or VPC.
- **Traceability**: All requests have an associated `X-Request-ID` header injected. This ID is propagated across all log streams, letting you match Node.js requests to AI Gateway executions easily.

---

## 📡 API Endpoints

### 1. Health Status
- **Route**: `GET /internal/health`
- **Authentication**: None required.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "service": "FluentAI AI Gateway",
      "active_llm_provider": "openai",
      "version": "1.0.0"
    },
    "error": null
  }
  ```

### 2. Conversational Voice Loop
- **Route**: `POST /internal/converse`
- **Authentication**: Required (`X-Internal-Key`).
- **Request Body**:
  ```json
  {
    "session_id": "99f36f6d-78fb-45ba-b072-882245b0a34f",
    "user_id": "40a5be71-cf9a-412f-9be1-081e64d71bc2",
    "transcript": "Today I goes to office.",
    "conversation_history": [
      { "role": "USER", "content": "Hello!" },
      { "role": "ASSISTANT", "content": "Hi there! How can I help you?" }
    ],
    "target_language": "en",
    "proficiency_level": "INTERMEDIATE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "reply_text": "Oh, that sounds interesting! Make sure to say 'went' since it is in the past.",
      "corrected_text": "Today I went to the office.",
      "feedback": "Use the past tense verb 'went' instead of 'goes' when talking about past actions.",
      "corrections": [
        {
          "original": "I goes",
          "corrected": "I went",
          "explanation": "Past tense verb is required.",
          "grammar_rule": "Tense"
        }
      ],
      "emotion": "explaining",
      "blend_shapes": {
        "browInnerUp": 0.3,
        "mouthOpen": 0.25,
        "jawOpen": 0.15
      }
    },
    "error": null
  }
  ```

### 3. Translation
- **Route**: `POST /internal/translate`
- **Authentication**: Required (`X-Internal-Key`).
- **Request Body**:
  ```json
  {
    "text": "Hello, how are you?",
    "source_language": "en",
    "target_language": "ml"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "translated_text": "ഹലോ, സുഖമാണോ?",
      "detected_source_language": "en"
    },
    "error": null
  }
  ```

### 4. Pronunciation Evaluation
- **Route**: `POST /internal/pronunciation`
- **Authentication**: Required (`X-Internal-Key`).
- **Description**: This endpoint runs asynchronously outside the synchronous voice loops (fire-and-forget) to keep conversational latency low.
- **Request Body**:
  ```json
  {
    "session_id": "99f36f6d-78fb-45ba-b072-882245b0a34f",
    "user_id": "40a5be71-cf9a-412f-9be1-081e64d71bc2",
    "audio_url": "https://storage.googleapis.com/fluentai/audio/sample.wav",
    "reference_text": "Today I went to the office"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "overall_score": 86.5,
      "accuracy_score": 87.0,
      "fluency_score": 84.0,
      "completeness_score": 95.0,
      "words": [
        {
          "word": "Today",
          "score": 85.0,
          "phonemes": [
            { "phoneme": "aa", "score": 82.0 },
            { "phoneme": "r", "score": 88.0 }
          ]
        }
      ]
    },
    "error": null
  }
  ```

---

## 🎨 Avatar Blend Shape Presets Design

To minimize client-side processing, we chose to **perform the emotion-to-blend-shapes mapping directly within the gateway service layer** rather than leaving the lookup exclusively to the client UI.

### Why this design?
- **Uniformity**: Centralizing this mapping inside `avatar_service.py` ensures that any future avatars or talking head integrations receive identical, standardized facial preset properties directly inside the `ConverseResponse` payload (`blend_shapes` key), rather than needing to replicate the mapping rules on the React frontend.
- **Customizability**: Standard presets return weights (e.g. `mouthSmile`, `eyeSquint`, `browInnerUp`) that map directly to standard mesh animation keys (like `TalkingHead.js`).
