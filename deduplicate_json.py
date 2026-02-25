import json
import os

def deduplicate_json(file_path):
    print(f"Deduplicating {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        # We need a custom decoder or just load it normally and it might overwrite duplicates
        # Actually, standard json.load overwrites duplicates if they are at the same level
        # which is exactly what we want!
        try:
            data = json.load(f)
        except Exception as e:
            print(f"Error loading JSON: {e}")
            return

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Finished deduplicating {file_path}")

deduplicate_json('client/src/locales/en.json')
deduplicate_json('client/src/locales/ku.json')
