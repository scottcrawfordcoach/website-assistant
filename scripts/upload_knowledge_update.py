import os
from pathlib import Path

import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "website_assistant_knowledge"
REPO_ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_DIR = REPO_ROOT / "supabase" / "storage" / "website_assistant_knowledge"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit(
        "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
    )

FILES_TO_UPLOAD = [
    {
        "local_path": KNOWLEDGE_DIR / "behavior.json",
        "storage_path": "behavior.json",
        "content_type": "application/json"
    },
    {
        "local_path": KNOWLEDGE_DIR / "crawford-coaching-knowledge.md",
        "storage_path": "crawford-coaching-knowledge.md",
        "content_type": "text/markdown"
    },
    {
        "local_path": KNOWLEDGE_DIR / "class_availability.csv",
        "storage_path": "class_availability.csv",
        "content_type": "text/csv"
    },
    {
        "local_path": KNOWLEDGE_DIR / "approved_sources.csv",
        "storage_path": "approved_sources.csv",
        "content_type": "text/csv"
    },
    {
        "local_path": KNOWLEDGE_DIR / "exercises.csv",
        "storage_path": "exercises.csv",
        "content_type": "text/csv"
    }
]

for file_info in FILES_TO_UPLOAD:
    local_path = file_info["local_path"]
    storage_path = file_info["storage_path"]
    content_type = file_info["content_type"]

    if not os.path.exists(local_path):
        print(f"File not found: {local_path}")
        continue

    with open(local_path, 'rb') as f:
        file_content = f.read()

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }

    print(f"Uploading {storage_path}...")
    response = requests.post(url, data=file_content, headers=headers)

    if response.status_code == 200:
        print(f"Successfully uploaded {storage_path}")
    else:
        print(f"Failed to upload {storage_path}: {response.status_code} - {response.text}")
