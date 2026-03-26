# Crawford Coaching — Assistant UI Redesign Guide
## For Copilot: Reskinning ScottBot to match the Crawford Coaching design language

---

## Overview

The ScottBot assistant UI has been fully redesigned to match the Crawford Coaching visual identity. Two deliverables were produced:

- **`chat.html`** — A standalone full-page chat interface at `/chat` or `/assistant`
- **`chat-widget.js`** — A self-contained floating widget that can be embedded on any page with a single `<script>` tag

Both replace the previous GoDaddy-era UI which used system fonts, bright blue gradients, rounded pill buttons, white card backgrounds, and emoji-heavy disclaimer boxes.

---

## What Changed (Changelog)

### Visual Language
| Before | After |
|--------|-------|
| System fonts (`-apple-system`, Roboto) | Cormorant Garamond (display) + Jost (UI) |
| Bright blue gradient background (`#2ba5d8`) | Deep dark background (`--ink: #0e0f10`) |
| White chat cards with box shadows | Dark slate message bubbles (`--slate: #1c2330`) |
| Rounded pill buttons (`border-radius: 999px`) | Square buttons (`border-radius: 1px`) |
| Blue CTA buttons (`#1677ea`) | Brand blue (`--brand-blue: #2d86c4`) |
| Emoji headers (💬 ⚠️) | Tracked uppercase sans labels |
| Yellow disclaimer card | Collapsible inline disclaimer panel |
| Fixed "Coach Scott Bot" topbar | Restrained header with avatar, name, sub-label |
| Generic chat bubble icon trigger | Scott's face photo + "Ask Scott" / "Instant answers" label |

### Functionality
| Before | After |
|--------|-------|
| Pill-shaped shortcut grid (3 columns) | Wrapped tag-style shortcut buttons |
| Italic "typing..." text | Three-dot animated typing indicator |
| Prominent disclaimer boxes always visible | Disclaimer hidden behind `i` button, expands inline |
| Fixed position back link (overlapping) | Back link inside header action row |
| Generic chat icon trigger button | Photo avatar + name + "Instant answers" label |
| No floating widget | Self-contained `chat-widget.js` embeds on any page |

### Copy
| Before | After |
|--------|-------|
| "Coach Scott Bot" | "Ask Scott" |
| "Use this assistant to find out more about..." | "AI Assistant · Crawford Coaching" |
| "WHOLE" | "the WHOLE Program" |
| Emoji-led info cards | Clean prose disclaimer |
| "Chat Now" | "Send" |

---

## Design Tokens

All values match the main Crawford Coaching design system exactly.

```css
/* Colour palette */
--ink:               #0e0f10;   /* page background */
--slate:             #1c2330;   /* card/panel background */
--slate-mid:         #232f3e;   /* input hover state */
--fog:               #3d4a58;   /* borders, placeholders */
--mist:              #7a8fa3;   /* secondary labels */
--pale:              #c8d4de;   /* readable secondary text */
--white:             #f5f3ef;   /* primary text */
--brand-blue:        #2d86c4;   /* CTA, accents, user messages */
--brand-blue-light:  #4fa3d8;   /* hover state */
--whole-sage:        #7a9b6d;   /* online indicator dot */

/* Typography */
--serif-display: 'Cormorant Garamond', Georgia, serif;
--sans:          'Jost', sans-serif;
```

---

## Component Patterns

### Trigger Button (Widget)
- Dark background (`--slate`) with blue border
- Scott's photo in a circular avatar (36×36px, `border: 1px solid rgba(45,134,196,0.35)`)
- "Ask Scott" in Cormorant Garamond 400, `--white`
- "Instant answers" in Jost 300, 0.58rem, `letter-spacing: 0.18em`, uppercase, `--pale`
- Green online dot (`--whole-sage: #7a9b6d`) top-right of button
- No rounded corners on the button itself (`border-radius: 1px`)
- Hover: lighten background, increase border opacity, `translateY(-2px)`

### Chat Panel / Page Header
- Avatar: 48px (page) / 36px (widget), circular, blue border
- Name: Cormorant Garamond 400, ~1rem–1.3rem, `--white`
- Sub-label: Jost 200–300, 0.68rem, `letter-spacing: 0.18em`, uppercase, `--pale`
- Action buttons: ghost style — `border: 1px solid rgba(122,143,163,0.25)`, `--mist` text, `border-radius: 1px`
- No bold, no colour fills on secondary buttons

### Messages
- **User messages:** `background: --brand-blue`, `color: --white`, no border-radius or 1px only
- **Assistant messages:** `background: --slate`, `color: --pale`, `border-left: 2px solid rgba(45,134,196,0.4)`
- Font: Jost 300, 0.82–0.88rem, `line-height: 1.6`
- Entry animation: `opacity 0 → 1`, `translateY(6px → 0)`, 0.18–0.2s ease

### Typing Indicator
- Three dots, 4–5px each, `background: --mist`, circular
- Staggered opacity/scale animation, 1.2s loop, delays of 0.2s

### Shortcut Buttons
- Jost 300, ~0.68–0.72rem, `--mist` default colour
- `border: 1px solid rgba(122,143,163,0.2)`, `border-radius: 1px`
- Hover: `--white` text, blue border `rgba(45,134,196,0.5)`, faint blue background
- Collapse (hidden class) on input focus, reappear on blur/clear
- Label above: Jost 200–300, ~0.6rem, `letter-spacing: 0.22–0.24em`, uppercase, `--mist`

### Input Area
- Input: `background: --slate`, borderless or minimal border, `--white` text, `--fog` placeholder
- Focus: `background: --slate-mid`, blue border accent
- Send button: `background: --brand-blue`, Jost 400, 0.65–0.72rem, `letter-spacing: 0.18em`, uppercase
- No rounded corners anywhere

### Disclaimer Panel
- Hidden by default, triggered by `i` button in header
- Expands with `max-height` transition (0 → fixed px)
- `background: --slate`, `border-bottom: 1px solid rgba(255,255,255,0.06)`
- Label: Jost 400, 0.58–0.65rem, `letter-spacing: 0.26–0.28em`, uppercase, `--brand-blue`
- Body: Jost 300, 0.72–0.8rem, `--mist`, `line-height: 1.6–1.7`
- Email link: `--brand-blue`

---

## Anti-Patterns (Do Not Use)

These were present in the original UI and must not reappear:

- `border-radius: 999px` — no pill shapes anywhere
- System font stack (`-apple-system`, `BlinkMacSystemFont`, `Roboto`, `Arial`)
- Bright blue gradient backgrounds
- White card backgrounds with box shadows
- Emoji in headers or labels
- `font-weight: bold` or `700` on UI elements (use 400 max for sans)
- Rounded input fields
- Colour `#1677ea` or `#007BFF` — use `--brand-blue: #2d86c4` only
- Yellow/amber disclaimer boxes
- "Coach Scott Bot" as the assistant name — use "Ask Scott"

---

## File Reference

| File | Purpose |
|------|---------|
| `chat.html` | Standalone full-page chat interface |
| `chat-widget.js` | Self-contained floating widget, drop before `</body>` |
| `scottlogo.png` | Scott's circular avatar photo — must be at `/scottlogo.png` on the server |

### Embedding the Widget
```html
<!-- Add before </body> on any page -->
<script src="/chat-widget.js"></script>
```

### Supabase Endpoint
```
https://yxndmpwqvdatkujcukdv.supabase.co/functions/v1/faq-bot
```
The widget POSTs `{ messages: [...] }` and expects `{ reply: "..." }` in response.

### localStorage Key
```
crawford_chat_history
```
Stores up to 20 messages. `Clear` button wipes it and resets to the welcome message.

---

## Quick Questions (Current Set)

These appear as shortcut buttons and should be updated as services evolve:

1. What is coaching, exactly?
2. Am I fit enough for Synergize?
3. What is the WHOLE Program?
4. What groups have free spots?
5. How much does coaching cost?
6. What's the difference between coaching and training?
7. Tell me your closure dates
