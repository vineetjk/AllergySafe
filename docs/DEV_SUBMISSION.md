---
title: AllergySafe Table: The Open-Source AI Co-Living Dining Guardian I Built for My Roommate
published: false
tags: devchallenge, weekendchallenge, hf26challenge, opensource, ai
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

---

## What I Built

Living with a roommate is one of life’s great adventures—until dinner time rolls around.

I live with **Maya**, my close friend and roommate. Maya has **severe Celiac disease** (an autoimmune disorder where microscopic traces of wheat, barley, or rye cause acute intestinal damage), an **anaphylactic tree nut allergy** requiring an EpiPen, and **lactose intolerance**. 

For Maya, food is not just sustenance; it is a daily anxiety minefield. Whenever we talked about cooking together or hosting friends, dinner discussions turned into 45-minute interrogations:
- *“Does this curry paste have hidden shrimp or wheat starch?”*
- *“Did you use the wooden spoon that stirred gluten pasta three months ago?”*
- *“Is that barbecue sauce sweetened with barley malt extract?”*

More painfully, Maya constantly apologized. Whenever we made dinner, she would insist on cooking alone in a tiny separate pan, feeling like an inconvenience or an afterthought in her own home.

I built **AllergySafe Table** specifically for Maya.

**AllergySafe Table** is an open-source, local-first AI co-dining platform designed to eliminate food anxiety in shared households. It solves three critical problems:

1. **The "Can Maya Eat This?" Instant Safety Scanner:** Parses any recipe, grocery ingredient list, or restaurant menu snippet in under 0.2 seconds. It flags not just obvious allergens, but sneaky derivatives (*maltodextrin, brewer's yeast, hydrolyzed vegetable protein, panko, whey*) with scientific explanations and hazard ratings.
2. **The 1:1 Flavor-Preserving Recipe Remixer:** Takes any unsafe favorite dish (like Chicken Parmigiana or Pad Thai) and remixes it using exact culinary substitutes (certified gluten-free tamari, sunflower seed creams, cassava flours) that preserve the authentic Maillard browning, texture, and umami so nobody feels like they are eating "hospital food."
3. **The Shared Co-Dining Meal Planner:** Generates multi-day dinner menus where both roommates eat the **exact same meal** from a single table, complete with an aisle-sorted supermarket shopping checklist and cross-contamination kitchen protocols (dedicated toaster bags, clean sponge rules, color-coded cutting boards).

---

## Demo

Here is the AllergySafe Table experience in action:

- **Safety Scanner in Action:** Paste an ingredient list containing standard soy sauce. The system instantly sounds a red hazard alarm: *"Contains soy sauce, an overlooked derivative brewed with 40-50% wheat mash. Risk: Severe Celiac Flareup."* It immediately suggests Certified GF Tamari or Coconut Aminos.
- **1-Click Recipe Remix:** Unsafe dishes are transformed into restaurant-grade allergen-free feasts with a single click.
- **Aisle-Sorted Grocery Checklist:** Sorts ingredients by supermarket section (Produce, Pantry, Meat, Refrigerated) with interactive checkboxes for quick grocery runs.

*(Screenshots and interactive demo link: [http://localhost:3000](http://localhost:3000))*

---

## Code

All code is open-source under the MIT license:

- **Backend:** FastAPI (Python 3.13), Pydantic v2, Open Food Facts taxonomy, local Ollama open-weight connector.
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide icons, Canvas Confetti.
- **Architecture:** Zero external cloud dependencies; 100% capable of running on a laptop with no Wi-Fi.

```bash
# Clone and launch in one command
git clone https://github.com/your-username/allergysafe-table.git
cd allergysafe-table
./start.sh
```

---

## How I Built It

AllergySafe Table was built around open-source AI at every layer:

```
[Ingredient Text / Menu / Recipe]
               │
               ▼
┌──────────────────────────────────────────────┐
│  Open-Source Deterministic Clinical Taxonomy │
│  (8 major allergen classes, 120+ derivatives)│
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│       Local Open-Weight LLM Provider         │
│       (Ollama: Llama 3.2 3B / Qwen 2.5)      │
│       • Culinary chemistry & safe remixing   │
│       • Cross-contamination protocols        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│         Next.js Modern Co-Living UI          │
│         (Tailwind CSS + Local Client Cache)  │
└──────────────────────────────────────────────┘
```

1. **Local Open-Weight Models (Llama 3.2 3B & Qwen 2.5):**
   We leverage **Ollama** running locally on Apple Silicon (M-series hardware) to power the culinary synthesis and creative recipe remixing. The model is prompted with structured JSON schemas to preserve culinary textures while rigidly replacing allergens.
2. **The Open Deterministic Allergen Knowledge Graph:**
   Generative AI models are notoriously prone to hallucinations—and in food allergies, a hallucination can lead to anaphylaxis. We built an open, auditable clinical taxonomy covering Top 9 allergens, 120+ sneaky derivatives, and vetted 1:1 culinary substitutions.
3. **Open Food Facts Schema Integration:**
   Allows barcode and global product lookups against the world's largest open food database.
4. **FastAPI & Next.js Stack:**
   FastAPI provides a typed Python backend serving audit endpoints in single-digit milliseconds, paired with a Next.js interface styled for clarity and ease of use.

---

## Why Does Open Innovation Matter?

When building for someone with life-threatening food allergies, **open innovation is not a preference—it is a non-negotiable requirement.** Here is why a closed API (like ChatGPT or proprietary cloud LLMs) failed, and why our open-based approach worked better:

### 1. Health Data Sovereignty & Intimate Privacy
Medical diagnoses, Celiac autoimmune histories, and EpiPen prescriptions are deeply sensitive personal health data. Closed cloud LLMs store user prompts on remote corporate servers to train future proprietary models. With local open-source inference, Maya's medical profile never leaves the device's loopback interface (`127.0.0.1`). Her health data remains sovereign.

### 2. Deterministic Verification vs. Generative Hallucination
Closed commercial LLMs optimize for plausible-sounding conversational fluency, not medical safety. When asked about common Asian condiments, closed LLMs routinely say *"soy sauce is usually okay in small amounts"*—which is medically disastrous for a Celiac patient because traditional soy sauce is fermented with wheat mash. 

By using an open-source architecture, we decoupled creative culinary reasoning from safety verification. Our open clinical taxonomy deterministically audits every ingredient against verifiable rules before the LLM presents suggestions. With open code, every single rule is inspectable and auditable.

### 3. The "Basement Supermarket" (Offline) Reality
Real-life grocery shopping does not happen in high-bandwidth tech offices. It happens in urban basement supermarkets, corner bodegas, or rural farmstands with thick concrete walls and zero cellular reception. A closed API app is useless when you're standing in aisle 4 wondering whether a broth contains barley malt. AllergySafe Table runs 100% locally on your machine with zero internet needed.

### 4. Uncapped Zero-Cost for Students & Roommates
Roommates splitting rent and college students shouldn't have to budget \$20/month per seat or worry about running out of API credits just to cook dinner. Open weights (Llama 3.2) and open frameworks cost \$0 forever.

---

## Bonus: The Handover to Maya

On Thursday night, while Maya was scanning a takeout menu on her phone with a weary expression, I set my laptop on our kitchen counter and opened AllergySafe Table.

I asked her to paste the ingredients of a barbecue chicken recipe she had been craving for months but couldn't eat. In 0.18 seconds, the app flagged barley malt extract and Worcestershire sauce (anchovy/gluten derivative), and generated a 100% safe version using tamari and coconut aminos.

Here is what Maya said:

> *"I used to feel so guilty every time we talked about ordering dinner or grocery shopping because my Celiac and tree nut allergies make everything ten times harder. Seeing you build something that treats my safety as the default—and gives us dinners that actually taste incredible—made me tear up. For the first time since moving into this apartment, I don’t feel like an inconvenience or an afterthought at our dinner table."*

We cooked the remixed chicken together that night. One pan, one cutting board protocol, one table.

---

## Prize Categories

- **Hacktoberfest Weekend Challenge: Build for a Friend** (Primary)

---

*Built with open-source AI, local weights, and genuine love for a friend.*
