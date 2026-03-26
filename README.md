# Crawford Coaching — Ask Scott Assistant

AI-powered assistant for Crawford Coaching. Two interfaces:

- **`chat.html`** — Standalone full-page chat at `/`, `/chat`, or `/assistant`
- **`chat-widget.js`** — Floating widget embeddable on any page via `<script>` tag

## Project Structure

- `frontend/`: Static files deployed to Vercel (chat page, widget JS, avatar image)
- `supabase/functions/faq-bot/`: Backend Edge Function (Anthropic Claude + USDA nutrition tool)
- `supabase/storage/website_assistant_knowledge/`: Knowledge base files (Markdown, CSV, JSON)
- `chat-widget.js`: Source for the floating widget (also copied to `frontend/`)

## Deployment

### Frontend (Vercel)

The `frontend/` directory is deployed as a static site. Key files served:
- `/chat.html` — standalone chat page
- `/chat-widget.js` — floating widget script
- `/scottlogo.png` — Scott's avatar image

Routes configured in `vercel.json`:
- `/` → `chat.html`
- `/assistant` → `chat.html`
- `/chat` → `chat.html`

Push to your connected Git repo and Vercel auto-deploys, or use `vercel --prod`.

### Edge Function (Supabase)

1. Install & login to Supabase CLI
2. Link project:
   ```bash
   supabase link --project-ref yxndmpwqvdatkujcukdv
   ```
3. Set secrets:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=your_key
   supabase secrets set FDC_API_KEY=your_usda_key
   ```
4. Deploy:
   ```bash
   supabase functions deploy faq-bot --no-verify-jwt
   ```

### Knowledge Base (Supabase Storage)

Upload files from `supabase/storage/website_assistant_knowledge/` to the `website_assistant_knowledge` bucket in Supabase Storage.

## Embedding the Widget

Add before `</body>` on any page where the widget should appear:

```html
<script src="https://your-vercel-domain.vercel.app/chat-widget.js"></script>
```

The widget injects its own fonts (Cormorant Garamond + Jost) and styles. No other dependencies needed.
