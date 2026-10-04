# AllergySafe Table

> **Can Prithvi eat this?** A food companion built for a friend.
> *Submission for the Hacktoberfest Weekend Challenge: Build for a Friend (HF26)*

Prithvi is sometimes lactose intolerant, has a sensitive gut, has high TSH (thyroid), and is working on losing weight. Planning food around all four at once is hard, especially when ordering out or cooking together. AllergySafe Table answers the everyday question, *"can she eat this?"*, and suggests easy swaps and healthier options.

The profile is editable, so the app also works for other people and for food allergies such as gluten, nuts, peanuts, soy, eggs, shellfish, and sesame.

---

## What it does

- **Ask (conversational):** ask in plain words, like *"Can Prithvi eat paneer butter masala?"* or *"What can she have for breakfast?"*. You can type, speak, or send a photo. Answers explain why, suggest swaps, and can be read aloud. If it doesn't know a dish, it asks for the ingredients.
- **Ingredient scanner:** paste a recipe or a packaged-food label and see what to watch out for, with a suggested swap for each item.
- **Photo check:** take or upload a photo. Without an image model on the server, the dish name you type is used to look up typical ingredients. The app never guesses.
- **Recipe remixer:** swaps only the ingredients that clash with the profile and keeps the rest of the dish. It can read the steps aloud hands-free.
- **Meal planner:** 3, 5, or 7 dinners that suit the profile, so everyone eats the same meal, with a shopping list.
- **Food notes:** record what she loved and what didn't sit well.
- **Light and dark themes, phone-friendly layout.**

### How the checks work

Every verdict comes from open, readable rules in the backend's engine folder:

| Profile item | Treated as | Examples flagged |
| :--- | :--- | :--- |
| Lactose (sometimes) | Caution | Milk, cream, paneer, curd, lassi, kheer. Ghee is treated as fine. |
| Sensitive gut | Caution | Deep-fried food, very spicy dishes, fizzy drinks, alcohol, sugar alcohols, rajma |
| High TSH (thyroid) | Caution | Soy foods, soya chunks, bajra, large raw cruciferous portions |
| Weight loss goal | Caution | Fried snacks, sweets, sugar, maida, heavy cream, sugary drinks |
| Food allergies | Danger | Gluten, tree nuts, peanuts, dairy, soy, eggs, shellfish, sesame, including hidden sources |

The dish library holds typical ingredients for about 80 common Indian and international dishes and foods. This is general food guidance, not medical advice.

---

## Tech

| Part | Technology |
| :--- | :--- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11+) with a rule-based food engine |
| Voice | ElevenLabs: Eleven v4 Turbo for speech, Scribe v2 for voice questions. Falls back to the browser's voice without a key. |
| Optional local model | Ollama (for example Google Gemma) for photo recognition and future features |
| Hosting | Render Blueprint (`render.yaml`) for both services |
| CI | GitHub Actions: backend tests on Python 3.11 to 3.13, frontend build |

The browser only talks to the Next.js server. Next.js forwards `/api/*` to the backend, so there are no cross-origin or mixed-content problems on phones. Each visitor's profile and notes are stored in their own browser, never on the server.

```
backend/app/
  api/routes.py                 REST endpoints (/ask, /scan, /scan-image, /remix, /meal-plan, /voice-guide, /speak, /transcribe)
  api/rate_limit.py             Limits on the endpoints that spend ElevenLabs credits
  engine/assistant.py           Conversational "can she eat this?" logic
  engine/food_library.py        Typical dish ingredients and the healthy meal library
  engine/allergen_knowledge_base.py  Allergens, health conditions, and swaps
  engine/safety_analyzer.py     Matches ingredients against a profile
  engine/recipe_remixer.py      Profile-aware swaps
  engine/meal_planner.py        Profile-aware dinner plans
  engine/voice_service.py       ElevenLabs speech and transcription
frontend/src/
  components/AskAssistant.tsx   Chat with text, voice, and photo input
  lib/api.ts                    API client (shows real errors; no fake fallbacks)
  lib/profile.ts                Default profile, stored per browser
```

---

## Run locally

Prerequisites: Python 3.11+, Node.js 20.9+.

```bash
# one-time setup
python3 -m venv backend/venv
backend/venv/bin/pip install -r backend/requirements.txt
(cd frontend && npm install)

# optional: voice
cp backend/.env.example backend/.env   # then add your ElevenLabs API key

./start.sh
```

- Laptop: http://localhost:3000
- Phone on the same Wi-Fi: the address `start.sh` prints. Voice input and the live camera need HTTPS, so on a phone use the hosted site or photo upload.

Run the tests:

```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
(cd frontend && npm run lint && npm run build)
```

---

## Deploy on Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Both services are created from `render.yaml`.
3. On the backend service, set `ELEVENLABS_API_KEY` in **Environment**.
4. If Render gives the backend a URL other than `https://allergysafe-table-api.onrender.com`, set the frontend's `BACKEND_URL` to the real URL and redeploy the frontend.

Free Render services sleep when idle, so the first request after a while can take up to a minute.

---

## Why open source

- **Private:** the food checks run on the app's own server with open rules, and profiles stay in the browser. ElevenLabs is used only when someone uses voice.
- **Checkable:** every verdict can be traced to a rule anyone can read and correct.
- **Self-hostable:** runs on a laptop with no paid AI API.
- **Free to improve:** anyone can add dishes, ingredients, or conditions.

Read the hackathon write-up in [docs/DEV_SUBMISSION.md](docs/DEV_SUBMISSION.md).
