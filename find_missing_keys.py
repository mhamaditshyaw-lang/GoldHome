
import json

en_path = r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\client\src\locales\en.json'
ku_path = r'c:\Users\a\.gemini\antigravity\scratch\malialtwni\client\src\locales\ku.json'

def get_keys(d, parent_key=''):
    keys = set()
    for k, v in d.items():
        new_key = f"{parent_key}.{k}" if parent_key else k
        if isinstance(v, dict):
            keys.update(get_keys(v, new_key))
        else:
            keys.add(new_key)
    return keys

with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

with open(ku_path, 'r', encoding='utf-8') as f:
    ku_data = json.load(f)

en_keys = get_keys(en_data)
ku_keys = get_keys(ku_data)

missing_keys = en_keys - ku_keys
print(f"Missing keys in ku.json: {len(missing_keys)}")
for key in sorted(list(missing_keys)):
    print(key)
