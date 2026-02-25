
import json

en_path = r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\client\src\locales\en.json'
ku_path = r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\client\src\locales\ku.json'

def get_keys_with_values(d, parent_key=''):
    items = {}
    for k, v in d.items():
        new_key = f"{parent_key}.{k}" if parent_key else k
        if isinstance(v, dict):
            items.update(get_keys_with_values(v, new_key))
        else:
            items[new_key] = v
    return items

with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

with open(ku_path, 'r', encoding='utf-8') as f:
    ku_data = json.load(f)

en_items = get_keys_with_values(en_data)
ku_items = get_keys_with_values(ku_data)

missing_keys = set(en_items.keys()) - set(ku_items.keys())

result = {k: en_items[k] for k in sorted(list(missing_keys))}

with open(r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\missing_keys.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("File updated successfully.")
