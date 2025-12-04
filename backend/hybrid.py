import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from config import INDICES_DIR, EMBEDDING_MODEL_NAME

# Chargement global des ressources (une seule fois au démarrage)
try:
    print("Chargement des index en mémoire...")
    MODEL = SentenceTransformer(EMBEDDING_MODEL_NAME)
    FAISS_INDEX = faiss.read_index(str(INDICES_DIR / "faiss.index"))
    with open(INDICES_DIR / "bm25.pkl", "rb") as f:
        BM25_INDEX = pickle.load(f)
    with open(INDICES_DIR / "docstore.pkl", "rb") as f:
        DOCS = pickle.load(f)
    RESOURCES_LOADED = True
except Exception as e:
    print(f"Erreur chargement index : {e}. Avez-vous lancé indexing.py ?")
    RESOURCES_LOADED = False

def search_hybrid(query: str, top_k: int = 5, rerank: bool = True):
    """Recherche hybride combinant BM25 et FAISS."""
    if not RESOURCES_LOADED:
        raise RuntimeError(
            "Les index ne sont pas chargés. Veuillez exécuter 'python indexing.py' d'abord."
        )
    
    if not query or not query.strip():
        return []

    # 1. Recherche BM25 (Mots-clés)
    tokenized_query = query.lower().split()
    # On récupère un peu plus de candidats pour le reranking
    bm25_scores = BM25_INDEX.get_scores(tokenized_query)
    top_bm25_indices = np.argsort(bm25_scores)[::-1][:top_k*2]

    # 2. Recherche FAISS (Sens)
    query_vector = MODEL.encode([query]).astype('float32')
    distances, top_faiss_indices = FAISS_INDEX.search(query_vector, top_k*2)
    top_faiss_indices = top_faiss_indices[0] # Aplatir

    # 3. Fusion des résultats (Reciprocal Rank Fusion simplifié)
    results = {}
    
    # Traitement BM25
    for rank, idx in enumerate(top_bm25_indices):
        if idx not in results:
            results[idx] = {'score': 0, 'doc': DOCS[idx]}
        results[idx]['score'] += 1 / (rank + 60) # Poids BM25
        
    # Traitement FAISS
    for rank, idx in enumerate(top_faiss_indices):
        if idx == -1: continue
        if idx not in results:
            results[idx] = {'score': 0, 'doc': DOCS[idx]}
        results[idx]['score'] += 1 / (rank + 60) # Poids FAISS

    # Tri final
    sorted_results = sorted(results.values(), key=lambda x: x['score'], reverse=True)
    
    # Formatage sortie (limiter à top_k)
    final_output = []
    for res in sorted_results[:top_k]:
        final_output.append({
            "path": res['doc']['source'],
            "preview": res['doc']['content'][:500],  # Limiter la longueur de l'aperçu
            "hybrid_score": float(res['score'])  # Conversion explicite en float
        })
        
    return final_output