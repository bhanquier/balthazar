import os
import pickle
import faiss
import numpy as np
from docx import Document as DocxDocument
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
from config import DOCS_DIR, INDICES_DIR, EMBEDDING_MODEL_NAME

def load_docx_files():
    """Lit tous les fichiers .docx du dossier documents."""
    documents = []
    print(f"Lecture des documents depuis : {DOCS_DIR}")
    
    # Vérifier que le dossier existe
    if not DOCS_DIR.exists():
        print(f"ERREUR : Le dossier {DOCS_DIR} n'existe pas.")
        return []
    
    # Vérifier qu'il n'est pas vide
    files = list(DOCS_DIR.glob('*.docx'))
    if not files:
        print("ATTENTION : Aucun fichier .docx trouvé dans le dossier 'documents'.")
        return []

    for file_path in files:
        filename = file_path.name
        # Ignorer les fichiers temporaires Word
        if filename.startswith('~$'):
            continue
            
        try:
            doc = DocxDocument(file_path)
            # On découpe par paragraphe non vide
            para_count = 0
            for para in doc.paragraphs:
                text = para.text.strip()
                if len(text) > 20:  # On ignore les paragraphes trop courts
                    documents.append({
                        "content": text,
                        "source": filename
                    })
                    para_count += 1
            print(f"  {filename}: {para_count} paragraphes extraits")
        except Exception as e:
            print(f"  Erreur lecture {filename}: {e}")
    
    print(f"{len(documents)} paragraphes extraits.")
    return documents

def build_indices():
    """Construit les index FAISS et BM25."""
    docs = load_docx_files()
    if not docs:
        print("ERREUR : Aucun document à indexer.")
        return 0

    print("Chargement du modèle d'embedding...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    
    # 1. FAISS (Recherche Vectorielle/Sens)
    print("Création de l'index Vectoriel (FAISS)...")
    texts = [d["content"] for d in docs]
    embeddings = model.encode(texts, show_progress_bar=True)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings).astype('float32'))
    
    # 2. BM25 (Recherche par Mots-clés)
    print("Création de l'index Lexical (BM25)...")
    tokenized_corpus = [doc["content"].lower().split() for doc in docs]
    bm25 = BM25Okapi(tokenized_corpus)

    # 3. Sauvegarde
    print("Sauvegarde des index...")
    faiss.write_index(index, str(INDICES_DIR / "faiss.index"))
    
    with open(INDICES_DIR / "bm25.pkl", "wb") as f:
        pickle.dump(bm25, f)
        
    with open(INDICES_DIR / "docstore.pkl", "wb") as f:
        pickle.dump(docs, f)

    print(f"Terminé ! Indexation réussie : {len(docs)} paragraphes indexés.")
    return len(docs)

if __name__ == "__main__":
    count = build_indices()
    if count:
        print(f"\n✅ Succès : {count} paragraphes indexés.")
    else:
        print("\n❌ Échec de l'indexation.")