import os
from pathlib import Path
import sys

# --- CHEMINS ---
BASE_DIR = Path(__file__).parent

# Dossier où vous mettez vos fichiers .docx
DOCS_DIR = BASE_DIR / "documents"

# Dossier où seront sauvegardés les index (créé automatiquement)
INDICES_DIR = BASE_DIR / "indices"

# --- MODÈLES ---
# Modèle d'embedding léger et rapide pour le local
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
# URL de votre Ollama local
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# --- API KEYS ---
# Assurez-vous de définir cette variable d'environnement ou de coller votre clé ici
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- VALIDATION ---
def validate_config():
    """Vérifie que la configuration est valide."""
    issues = []
    
    if not GEMINI_API_KEY:
        issues.append("⚠️  GEMINI_API_KEY n'est pas définie (QA Gemini ne fonctionnera pas)")
    
    return issues

# Création automatique des dossiers
try:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    INDICES_DIR.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"❌ Erreur lors de la création des dossiers : {e}")
    sys.exit(1)

# Afficher les avertissements de configuration
if __name__ == "__main__":
    issues = validate_config()
    if issues:
        print("\n⚠️  Problèmes de configuration détectés:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ Configuration valide")
    
    print(f"\nDossiers:")
    print(f"  DOCS_DIR: {DOCS_DIR}")
    print(f"  INDICES_DIR: {INDICES_DIR}")