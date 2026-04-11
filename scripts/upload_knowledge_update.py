import base64
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
DATA_HANDLER_TOKEN = os.getenv("DATA_HANDLER_BEARER_TOKEN")
DATA_HANDLER_URL = f"{SUPABASE_URL}/functions/v1/data-handler"
REPO_ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_DIR = REPO_ROOT / "supabase" / "storage" / "website_assistant_knowledge"

if not SUPABASE_URL or not DATA_HANDLER_TOKEN:
    raise SystemExit(
        "Error: SUPABASE_URL and DATA_HANDLER_BEARER_TOKEN must be set in the environment."
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
        content_b64 = base64.b64encode(f.read()).decode('utf-8')

    headers = {
        "Authorization": f"Bearer {DATA_HANDLER_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {
        "action": "knowledge_file_upload",
        "payload": {
            "name": storage_path,
            "content_b64": content_b64,
            "content_type": content_type,
        }
    }

    print(f"Uploading {storage_path}...")
    response = requests.post(DATA_HANDLER_URL, json=body, headers=headers)

    if response.status_code == 200:
        print(f"Successfully uploaded {storage_path}")
    else:
        print(f"Failed to upload {storage_path}: {response.status_code} - {response.text}")
