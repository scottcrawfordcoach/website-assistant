# Coach Scott Bot — Summary

## Purpose

The Coach Scott Bot is a **live FAQ and wellness assistant** embedded on Coach Scott Crawford's website. It acts *as* Scott — speaking in first person with a friendly, encouraging tone — to answer visitor questions about his coaching services, group fitness classes, scheduling, nutrition basics, and general wellness topics. Its primary goal is to convert website visitors into clients by providing helpful information and naturally promoting Scott's services (coaching, Synergize Group Fitness, blog, newsletter, email contact).

---

## Common Use Cases

1. **Service inquiries** — "What coaching packages do you offer?", "How much does it cost?", "What's the difference between Committed and Decisive?"
2. **Class availability & scheduling** — "What times are available?", "Is the Monday 9am class full?", "How do I join a group?"
3. **Getting started / booking** — Guiding visitors through the Intro Visit process (visit first, then join a class), sharing booking links and email contact
4. **Exercise explanations** — Explaining movements from the built-in workout generator using the exercises database
5. **Nutrition questions** — Real-time USDA food lookups (e.g., "How much protein in an egg?")
6. **General wellness Q&A** — Brief, non-prescriptive guidance on fitness, sleep, habits, stress, aerobic training (Maffetone Method), and footwear
7. **Interval timer / workout generator** — Directing users to the timer app for pacing, EMOM setup, and generated workouts

---

## Key Capabilities

| Capability | Details |
|---|---|
| **Knowledge-driven answers** | Pulls from a Supabase-hosted knowledge base (Markdown files, CSVs, JSON) covering Scott's bio, services, packages, gym details, class schedules, exercises, and approved sources |
| **Tiered information priority** | Tier 1: Direct knowledge base → Tier 1.5: Real-time USDA nutrition data → Tier 2: Approved expert sources → Tier 3: General wellness knowledge |
| **USDA nutrition tool** | Live API integration with the USDA FoodData Central database for precise nutritional lookups |
| **Conversational memory** | Maintains multi-turn conversation context so users can ask follow-ups naturally |
| **Non-directive coaching style** | Avoids giving prescriptive advice on life topics; offers perspectives and pivots to booking Scott's services |
| **Safety guardrails** | Declines medical advice, handles mental health/crisis situations with warmth and referrals, shuts down persistent harmful requests, and stays in-lane on off-topic questions |
| **Service promotion** | Naturally weaves in calls-to-action: booking links, blog, newsletter, and email contact — always with a low-pressure "soft start" option |
| **Class availability display** | Shows real-time class schedules with free spots, waitlist notes, and full-class indicators |
| **Exercise database** | Explains workout-generator exercises with body parts, rep schemes, instructions, and modifications from `exercises.csv` |

---

## Technical Stack

- **Backend:** Supabase Edge Function (Deno) calling the **Anthropic Claude Haiku** model
- **Knowledge base:** Supabase Storage bucket with Markdown, CSV, and JSON files
- **Frontend:** Embeddable HTML/JS chat widget (designed for GoDaddy integration)
- **External API:** USDA FoodData Central for real-time nutrition lookups
- **Deployment:** Vercel + Supabase CLI
