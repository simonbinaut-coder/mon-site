import os
import json

# Chemin vers le dossier des témoignages
temoignages_dir = "/home/simon/Documents/site/content/temoignages"
# Chemin vers le fichier JSON
json_file = os.path.join("/home/simon/Documents/site/content", "temoignages.json")

# Récupère tous les fichiers .txt dans le dossier
txt_files = [
    f for f in os.listdir(temoignages_dir)
    if f.endswith(".txt") and os.path.isfile(os.path.join(temoignages_dir, f))
]

# Met à jour le fichier JSON
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(txt_files, f, indent=2, ensure_ascii=False)

print(f"Fichier {json_file} mis à jour avec {len(txt_files)} témoignages.")
