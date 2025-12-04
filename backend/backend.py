import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.qa import router as qa_router
import sys

app = FastAPI(
    title="Balthazar API",
    description="API de recherche documentaire et QA avec RAG",
    version="1.0.0"
)

# Configuration CORS pour autoriser le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # En production, restreindre aux domaines spécifiques
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qa_router, prefix="/qa", tags=["QA"])

@app.get("/")
def root():
    """Endpoint racine pour vérifier que l'API fonctionne."""
    return {
        "message": "Balthazar API est opérationnelle",
        "version": "1.0.0",
        "endpoints": {
            "qa": "/qa",
            "status": "/qa/status"
        }
    }

if __name__ == "__main__":
    print("\n✨ Démarrage de Balthazar API...")
    print("   URL: http://127.0.0.1:8000")
    print("   Docs: http://127.0.0.1:8000/docs\n")
    
    try:
        uvicorn.run(
            "backend:app", 
            host="0.0.0.0", 
            port=8000, 
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n✅ Arrêt du serveur.")
        sys.exit(0)