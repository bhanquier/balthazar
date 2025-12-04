import requests
import os
from google import genai
from config import OLLAMA_URL, GEMINI_API_KEY
from hybrid import search_hybrid

def build_context(search_results, max_length=3000):
    """Construit le contexte en évitant les doublons de sources."""
    context_str = ""
    sources = []
    current_length = 0
    
    for res in search_results:
        doc_name = res['path']
        preview = res['preview']
        
        # Éviter les doublons de sources
        if doc_name not in sources:
            sources.append(doc_name)
        
        doc_context = f"\n[Document: {doc_name}]\n{preview}\n---\n"
        
        # Limiter la longueur du contexte
        if current_length + len(doc_context) > max_length:
            break
            
        context_str += doc_context
        current_length += len(doc_context)
    
    return context_str, sources

def query_gemini(prompt):
    if not GEMINI_API_KEY:
        return "Erreur : Clé API Gemini manquante dans config.py ou variable d'environnement."
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Erreur Gemini : {str(e)}"

def query_ollama(prompt):
    """Interroge Ollama avec un timeout approprié."""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.1}
            },
            timeout=120  # 2 minutes pour les modèles locaux
        )
        if response.status_code == 200:
            return response.json().get("response", "")
        return f"Erreur Ollama : Status {response.status_code}"
    except requests.exceptions.Timeout:
        return "Erreur : Ollama a mis trop de temps à répondre."
    except Exception as e:
        return f"Erreur connexion Ollama : {str(e)}"

def answer_question(question, top_k=5, use_rerank=True, provider="gemini"):
    """Point d'entrée principal pour le Question Answering."""
    # Validation
    if not question or not question.strip():
        return {
            "success": False, 
            "answer": "Erreur : Question vide.", 
            "sources": [],
            "documents_found": 0,
            "question": question
        }
    
    # 1. Recherche documentaire
    try:
        results = search_hybrid(question, top_k, use_rerank)
    except Exception as e:
        return {
            "success": False,
            "answer": f"Erreur lors de la recherche : {str(e)}",
            "sources": [],
            "documents_found": 0,
            "question": question
        }
    
    if not results:
        return {
            "success": True, 
            "answer": "Je n'ai trouvé aucun document pertinent pour cette question.", 
            "sources": [],
            "documents_found": 0,
            "question": question
        }

    context, sources = build_context(results)

    # 2. Prompt
    prompt = f"""Tu es un assistant expert nommé Balthazar.
Utilise les documents suivants pour répondre à la question.
Si la réponse n'est pas dans les documents, dis-le.

DOCUMENTS:
{context}

QUESTION: {question}
"""

    # 3. Génération
    if provider == "ollama":
        answer = query_ollama(prompt)
    else:
        answer = query_gemini(prompt)

    return {
        "success": True, 
        "answer": answer, 
        "sources": sources,
        "documents_found": len(results),
        "question": question
    }

def check_status():
    """Vérifie l'état des services IA."""
    ollama_ok = False
    try:
        response = requests.get("http://127.0.0.1:11434", timeout=3)
        ollama_ok = response.status_code == 200
    except:
        pass
    
    return {
        "ollama_available": ollama_ok, 
        "gemini_configured": bool(GEMINI_API_KEY),
        "ready": ollama_ok or bool(GEMINI_API_KEY)
    }