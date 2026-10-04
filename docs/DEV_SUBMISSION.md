---
title: "Can Prithvi Eat This? A Food Companion I Built for My Friend Living in a PG"
published: false
tags: devchallenge, weekendchallenge, hf26challenge, opensource
cover_image: https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/cover.png
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

My friend **Prithvi** lives in a PG (paying-guest accommodation). If you've lived in one, you know how food works there: the mess decides the menu, the kitchen isn't yours, and when the mess food doesn't work for you, the fallback is ordering in or grabbing something nearby.

For most people that's just boring. For Prithvi it's hard, because her body has a few rules of its own:

- **Lactose bothers her, but only sometimes.** A little ghee is fine; a bowl of paneer in cream might not be.
- **She has a sensitive gut.** Deep-fried, very spicy, or fizzy things can ruin her day.
- **Her TSH is high (thyroid).** Soy and some millets are best limited.
- **She's working on losing weight.** Fried snacks, sweets, and refined flour quietly add up.

Each of these is manageable on its own. The trouble is keeping all four in mind at once, every meal, with food she didn't cook. A mess dal is probably fine. The paneer butter masala on Sunday? The chole bhature someone orders for the floor? The masala chai? She can't always eat good food, so she needs a quick way to know which options are okay, which are okay in moderation, and how to make them better.

So I built **AllergySafe Table**, a small app that answers one question in plain words: **"Can Prithvi eat this?"**

- **Ask** in plain language by typing, speaking, or sending a photo: *"Can Prithvi eat paneer butter masala?"* or *"What can she have for breakfast?"* The answer comes back as a clear verdict, the reasons, easy swaps, and better options. It can also be read aloud.
- **Scan** a mess menu, a recipe, or a packaged-food label to see exactly which ingredients to watch.
- **Remix** a dish she loves into a version that suits her, swapping only what's needed.
- **Plan** dinners that suit her, with a shopping list, for the days she gets to cook or eat out with friends.
- **Notes** keep track of what she loved and what didn't sit well, so her own experience builds up over time.

Under the hood, two open pieces work together: **Google's open-weight Gemma 2, running locally through Ollama**, works out what's in a dish the app has never heard of, and a set of **open, readable food rules** decides whether that suits her. The model fills in the recipe; it never gets to say "safe".

It doesn't try to be a doctor. It's a friend who remembers all four of her rules, every single time.

## Demo

**Try it live: [allergysafe-table-web.onrender.com](https://allergysafe-table-web.onrender.com)**

It's on Render's free plan, so the first visit can take up to a minute while the server wakes up. The hosted version runs the open food rules and ElevenLabs voice, but not Gemma (see [Where it runs](#where-it-runs) below), so for a dish outside its library it asks you for the ingredients. Try *"Can Prithvi eat paneer butter masala?"* or *"What can she have for breakfast?"*

**Ask anything.** Her conditions are always visible, and the answer explains itself.

![Asking whether Prithvi can eat paneer butter masala](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/desktop-ask.png)

| Ask | Answer | Dark mode |
| :---: | :---: | :---: |
| ![Ask screen](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-ask.png) | ![Answer with swaps](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-answer.png) | ![Dark mode answer](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-dark.png) |

**A dish the app has never seen.** Dabeli isn't in its recipe list, so Gemma 2 (on the same laptop) guesses the ingredients. The rules spot the butter and suggest a swap, and the app shows exactly what Gemma guessed so Prithvi can correct it.

![Gemma 2 guessing what's in dabeli, and the rules flagging butter](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-gemma.png)

**Check a menu or a photo, remix a dish, plan dinners, and keep notes.**

| Ingredient check | Recipe remix | Dinner plan | Food notes |
| :---: | :---: | :---: | :---: |
| ![Scan result](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-scan.png) | ![Remixed recipe](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-remix.png) | ![Dinner plan](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-plan.png) | ![Food notes](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-notes.png) |

**Her profile** explains what each condition means in everyday terms. It's editable, so the app also works for anyone else, including people with real food allergies like gluten or nuts.

![Prithvi's food profile](https://raw.githubusercontent.com/vineetjk/AllergySafe/main/docs/screenshots/mobile-profile.png)

## Code

{% github vineetjk/AllergySafe %}

```bash
git clone https://github.com/vineetjk/AllergySafe.git
cd AllergySafe
python3 -m venv backend/venv && backend/venv/bin/pip install -r backend/requirements.txt
(cd frontend && npm install)
cp backend/.env.example backend/.env   # optional: add an ElevenLabs key for voice

# Optional, for dishes the app doesn't know: local Gemma 2 (about 1.6 GB)
brew install ollama && ollama serve &
ollama pull gemma2:2b

./start.sh
```

## How I Built It

**The stack:** a Next.js 16 frontend, a FastAPI backend, Gemma 2 (2B) through Ollama for unknown dishes, ElevenLabs for voice, and a Render Blueprint that deploys both services.

### Rules, not guesses

The heart of the app is a small, readable food engine, not a chatbot. When you ask about a dish, it:

1. **Works out what you mean.** It tells apart a dish ("can she eat rajma chawal?"), a list of ingredients, a request for ideas ("what can she have for breakfast?"), and a follow-up to its own question.
2. **Looks up typical ingredients** from a library of about 80 common Indian and international dishes, from dal makhani and masala dosa to pizza.
3. **Checks each ingredient** against her profile. Allergies (gluten, nuts, and so on) are marked **not safe**. Her conditions (lactose, gut, thyroid, weight goal) are marked **in moderation**, because that's what they are: things to limit, not things that will hurt her.
4. **Explains itself:** which ingredient caused each flag, a swap for each one, and a couple of healthier options.

### Gemma fills in the dishes the rules don't know

A library of 80 dishes will never cover everything a PG mess or a street stall serves. Before Gemma, asking about dabeli or misal pav got "I don't know, tell me the ingredients", which is the last thing you want to type at the counter.

Now the backend asks **Gemma 2 (2B), running locally in Ollama**, one narrow question: *what usually goes into this dish?* It replies in strict JSON, and the backend validates it (2 to 12 short ingredient names, or `{"known": false}` for anything that isn't food, so "can she eat my laptop" doesn't get a recipe). Those ingredients then go through the **same rules** as everything else.

```python
ingredients = await open_llm.suggest_ingredients(dish)   # Gemma 2: "what's in it?"
if ingredients:
    answer = FoodAssistant._analyse(profile, dish, ingredients, assumed=True)  # rules: "is it okay?"
    answer.ingredients_source = model                    # shown to her in the app
```

That split is deliberate:

- **The model only guesses ingredients.** It never decides whether something is safe. The verdict always traces back to a rule anyone can read.
- **The guess is shown, not hidden.** The app says *"Ingredients guessed by gemma2:2b on this device: ..."*, so Prithvi can see what it assumed.
- **She can correct it.** If Gemma is wrong, she types the real ingredients and the rules check again.

A 2B model is wrong sometimes. It left the fried farsan off misal pav, and it thought malai kofta had meat. That's exactly why it doesn't get the final say. When Ollama isn't running, the app quietly falls back to asking her for the ingredients.

#### Where it runs

Gemma runs on the same machine as the backend: a laptop on the same Wi-Fi, opened from a phone (`start.sh` prints the address to open). The free Render demo has only 512 MB of RAM, too little for Gemma, so **the [hosted demo](https://allergysafe-table-web.onrender.com) uses the rules only**. To get the Gemma step, run the app locally with the commands above.

### Indian food needed its own care

Paneer, curd, malai, and lassi count as dairy. Ghee is nearly lactose-free, so it isn't flagged for an intolerance. "Peanut butter" and "coconut milk" are not dairy, and "stir-fried" is not "deep-fried". When neither the library nor Gemma knows a dish, it says so and asks what's in it, instead of pretending. For photos without an image model, it asks for the dish name rather than guessing.

### Voice that sounds like a person

Prithvi can ask by voice and hear the answer, which matters when your hands are full or you're standing at the mess counter. Questions are transcribed with **ElevenLabs Scribe**. Answers are spoken with **Eleven v4 Turbo**, which is only available over a realtime websocket, so the backend streams the text, collects the audio, and returns a single clip. If that ever fails, it falls back to Turbo v2.5, so she still hears a real voice and not a robotic one.

iPhones block audio that starts after a network request, so the app starts a tiny silent clip at the moment you tap and reuses it for the real answer. Small detail, big difference on a phone.

### Built for a phone

Prithvi will use this on her phone, so the whole app is a phone-first shell: a bottom tab bar where every section is always visible, a chat where only the conversation scrolls and the input stays put, and light and dark themes.

### Production details

- The browser only talks to the Next.js server, which forwards `/api/*` to FastAPI, so there are no cross-origin or mixed-content issues on phones.
- Her profile and notes are stored **only in her browser**, never on a shared server.
- Endpoints that spend ElevenLabs credits are rate-limited, and every input has a size limit.
- If the server is slow or down, the app shows a clear error. It never invents a "safe" verdict.
- GitHub Actions runs the backend tests on Python 3.11 to 3.13 and builds the frontend on every push.

### Built with an agent

I paired with Claude Code, connected to DEV through DevRelay. This curated session shows the moment we found that Gemma was configured but never actually called, and how we wired it in so the model guesses ingredients and the rules make the call:

{% agent_session 439 %}

## Why Does Open Innovation Matter?

**Health details are personal.** Lactose, gut trouble, thyroid levels, and weight are things Prithvi shares with friends, not with an ad network or a model's training data. Gemma runs on the user's own machine, and it only ever sees a dish name, never her profile. The food checks use open rules, and her profile never leaves her browser. The only outside service is ElevenLabs, and only when she chooses to use voice.

**Every answer can be checked.** A closed chatbot might say "a little cream is fine" with total confidence. In this app, every verdict traces back to a rule in a plain Python file that anyone can read. If something is wrong for her, like "curd is actually fine for me", it can be fixed in one line, by anyone.

**It's free to run and easy to extend.** Nobody living in a PG should need a monthly AI subscription to figure out dinner. Gemma 2 2B is a 1.6 GB download that runs on an ordinary laptop with no internet and no API key. Anyone can swap in a bigger open model with one setting (`OLLAMA_MODEL`), add their own dishes or their mess's menu, or add another condition, and share it back.

A closed API would have given me a clever chatbot that decides on its own what's safe. An open model plus open rules gave Prithvi something she can trust, understand, and change.

## Prize Categories

- **Gemma:** Gemma 2 (2B), running locally through Ollama, works out the ingredients of dishes the app doesn't know, as validated JSON. The open food rules then decide the verdict, so the model fills in knowledge but never makes the safety call.
- **Render:** the whole app ships as a Render Blueprint (`render.yaml`). It deploys the FastAPI backend and the Next.js frontend as two services, with the frontend proxying API calls to the backend.
- **ElevenLabs:** voice questions use ElevenLabs Scribe for speech-to-text, and answers and recipe steps are read aloud with Eleven v4 Turbo over the realtime websocket, with a Turbo v2.5 fallback.

---

*Built with open source and a lot of care for a friend who deserves good food.*
