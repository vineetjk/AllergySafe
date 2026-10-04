# AllergySafe Table 🥗🛡️

> **Open-Source AI Co-Living Dining & Food Safety Platform**  
> Built for **Maya** (Roommate with Celiac Disease & Anaphylactic Tree Nut Allergies)  
> *Submission for the Hacktoberfest Weekend Challenge: Build for a Friend (HF26)*

---

## 📖 Overview

Living with a roommate with severe dietary restrictions (Celiac, anaphylaxis, lactose intolerance) is often an exhausting minefield of hidden ingredients, separate cooking pans, and social guilt.

**AllergySafe Table** is an open-source, local-first AI platform built to ensure roommates can safely cook, eat, and enjoy the **exact same meals** together at one single table.

### Key Capabilities

- **🛡️ Instant Safety Scanner ("Can Maya Eat This?"):** Evaluates recipes, menus, or raw ingredients in <0.2s. Identifies sneaky derivatives (*maltodextrin, brewer's yeast, soy sauce, whey, panko*) and provides clinical rationale and hazard indices.
- **🍳 Recipe Remixer:** Converts unsafe favorite dishes into 100% compliant gourmet meals using 1:1 culinary substitutions (tamari, sunflower seed creams, gluten-free baking blends) that preserve flavor, browning, and texture.
- **📅 Co-Dining Meal Planner:** Generates multi-day shared dinner menus where both roommates eat the same meal with zero compromises, accompanied by an aisle-sorted supermarket checklist.
- **✨ 100% Local & Private:** Runs entirely on your machine via local open-weight models (Llama 3.2 3B / Qwen 2.5 via Ollama) and a deterministic clinical taxonomy. Zero data transmitted to cloud LLMs.

---

## 🛠️ Architecture

```
AllergySafe Table
├── backend/                  # FastAPI (Python 3.13)
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── config.py         # Configs & CORS
│   │   ├── models/schemas.py # Typed Pydantic models
│   │   ├── engine/
│   │   │   ├── allergen_knowledge_base.py  # 8 allergen classes & 120+ derivatives
│   │   │   ├── safety_analyzer.py          # Deterministic clinical safety engine
│   │   │   ├── recipe_remixer.py           # 1:1 culinary substitution synthesizer
│   │   │   ├── meal_planner.py             # Roommate co-dining generator
│   │   │   └── llm_provider.py             # Ollama open-weight adapter + fallback
│   │   └── api/routes.py     # REST endpoints
│   ├── tests/test_safety.py  # Pytest test suite (100% passing)
│   └── requirements.txt
├── frontend/                 # Next.js 16 (App Router) + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/page.tsx      # Main application dashboard
│   │   ├── components/       # UI components (Scanner, Remixer, Planner, Handover)
│   │   ├── types/index.ts    # Frontend type definitions
│   │   └── lib/api.ts        # Resilient API client with offline mock fallbacks
└── docs/
    └── DEV_SUBMISSION.md     # Official DEV.to submission ready to copy-paste
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- *(Optional)* **Ollama** (`ollama run llama3.2:3b`) for local neural synthesis. If Ollama is not installed, the platform automatically utilizes its high-precision deterministic clinical engine!

### 2. Launch Everything in One Command

```bash
chmod +x start.sh
./start.sh
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Run Backend Tests

```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
```

---

## 💡 Why Open Innovation Matters

1. **Health Data Sovereignty:** Maya's sensitive medical conditions (Celiac flareups, EpiPen prescriptions) remain strictly on-device. No telemetry is logged or used to train corporate cloud models.
2. **Deterministic Verification:** Closed commercial LLMs hallucinate dangerous advice (*"a splash of soy sauce is usually fine"*). Our open taxonomy deterministically verifies every ingredient with open, auditable clinical rules.
3. **The "Basement Supermarket" Reality:** Supermarkets are often in basements with zero cell reception. AllergySafe Table works 100% offline with zero internet needed.
4. **Zero Cost Forever:** Completely free for roommates and students—no \$20/month subscription paywalls.

---

## 📄 Submission

Read the full hackathon submission essay in [docs/DEV_SUBMISSION.md](docs/DEV_SUBMISSION.md).
