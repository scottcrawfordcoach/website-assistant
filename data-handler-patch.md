# data-handler patch: `knowledge_base_load` action

Required to support the updated `faq-bot`, which no longer holds a Supabase
Service Role Key and instead proxies all storage reads through `data-handler`.

---

## Patch 1 — Add `knowledgeBaseLoad` function

Insert this function immediately **before** the `getTagCategoryMap` function.

```typescript
/**
 * knowledge_base_load
 * Lists and downloads all knowledge files (.md, .csv, .json) from the
 * website_assistant_knowledge storage bucket.
 * Returns Array<{ name: string; content: string }>.
 */
async function knowledgeBaseLoad(supabase: ReturnType<typeof createClient>) {
  const bucketName = "website_assistant_knowledge";
  const allowedExtensions = [".md", ".csv", ".json"];

  const { data: fileList, error: listError } = await supabase
    .storage
    .from(bucketName)
    .list();

  if (listError) {
    return { error: `Failed to list knowledge files: ${listError.message}` };
  }

  const knowledgeFiles = (fileList ?? []).filter(
    (f) => allowedExtensions.some((ext) => f.name.endsWith(ext))
  );

  const results: Array<{ name: string; content: string }> = [];

  for (const file of knowledgeFiles) {
    const { data, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(file.name);

    if (downloadError) {
      console.error(`Error downloading ${file.name}:`, downloadError);
      continue;
    }

    const content = await data.text();
    results.push({ name: file.name, content });
  }

  return { data: results };
}
```

---

## Patch 2 — Add case to the authenticated switch statement

In the `switch (action)` block inside the bearer-token-authenticated section,
add a new case **before** the `default` case:

```typescript
      case "knowledge_base_load":
        result = await knowledgeBaseLoad(supabase);
        break;
```

---

## Notes

- `knowledgeBaseLoad` requires no payload fields — `faq-bot` sends `payload: {}`.
- This action belongs in the **authenticated** switch (bearer token required),
  not the public routes. It reads the full knowledge base including config files.
- `SUPABASE_SERVICE_ROLE_KEY` is auto-injected by Supabase into `data-handler`,
  so the storage client works with no additional configuration.
- `DATA_HANDLER_BEARER_TOKEN` is already set as a Supabase project secret.
  `faq-bot` reads it via `Deno.env.get('DATA_HANDLER_BEARER_TOKEN')` —
  no additional secret-setting step required.

---

---

## Patch 3 — Add `knowledgeFileUpload` function

Insert this function immediately after `knowledgeBaseLoad` (i.e. also before `getTagCategoryMap`).

```typescript
/**
 * knowledge_file_upload
 * Accepts a base64-encoded file and upserts it into the
 * website_assistant_knowledge storage bucket.
 * Payload: { name: string; content_b64: string; content_type: string }
 */
async function knowledgeFileUpload(
  payload: { name: string; content_b64: string; content_type: string },
  supabase: ReturnType<typeof createClient>
) {
  if (!payload.name || !payload.content_b64 || !payload.content_type) {
    return { error: "name, content_b64, and content_type are required" };
  }

  const bucketName = "website_assistant_knowledge";

  // Decode base64 to binary
  const binaryString = atob(payload.content_b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const fileBlob = new Blob([bytes], { type: payload.content_type });

  const { error } = await supabase
    .storage
    .from(bucketName)
    .upload(payload.name, fileBlob, {
      contentType: payload.content_type,
      upsert: true,
    });

  if (error) return { error: error.message };
  return { data: { uploaded: payload.name } };
}
```

---

## Patch 4 — Add case to the authenticated switch statement

In the same `switch (action)` block as Patch 2, add a second case **before** the `default` case:

```typescript
      case "knowledge_file_upload":
        result = await knowledgeFileUpload(payload as { name: string; content_b64: string; content_type: string }, supabase);
        break;
```

---

## Notes

- `knowledge_file_upload` belongs in the **authenticated** switch (bearer token required).
- The upload script (`upload_knowledge_update.py`) base64-encodes files locally and sends them via this action. `SUPABASE_SERVICE_ROLE_KEY` is no longer needed anywhere outside `data-handler`.

---

## Deployment sequence

1. Apply all four patches to `data-handler/index.ts`
2. Deploy: `supabase functions deploy data-handler`
3. Deploy: `supabase functions deploy faq-bot`
4. Remove `SUPABASE_SERVICE_ROLE_KEY` from `faq-bot`'s Supabase secrets
