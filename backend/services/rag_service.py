import os
import random
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

from backend.config import settings

class RAGService:
    def __init__(self):
        self.client = None
        self._initialize_qdrant()
        
    def _initialize_qdrant(self):
        """
        Initialize Qdrant client using local folder path or in-memory fallback.
        """
        try:
            # We create a local storage path for Qdrant
            os.makedirs(settings.QDRANT_PATH, exist_ok=True)
            self.client = QdrantClient(path=settings.QDRANT_PATH)
            print(f"Qdrant initialized successfully at: {settings.QDRANT_PATH}")
        except Exception as e:
            print(f"Failed to initialize Qdrant at {settings.QDRANT_PATH}: {e}. Falling back to in-memory.")
            self.client = QdrantClient(location=":memory:")

    def _get_embedding_dimension(self) -> int:
        if settings.PREFERRED_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            return 1536  # text-embedding-3-small
        else:
            return 768   # models/text-embedding-004

    def _ensure_collection(self, collection_name: str):
        """
        Creates Qdrant collection if it does not already exist.
        """
        dimension = self._get_embedding_dimension()
        collections = self.client.get_collections().collections
        exists = any(c.name == collection_name for c in collections)
        
        if not exists:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=dimension, distance=Distance.COSINE),
            )
            print(f"Created Qdrant collection: {collection_name} with dimension {dimension}")

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector using the configured provider.
        """
        # Clean text
        text = text.strip().replace("\n", " ")
        if not text:
            return [0.0] * self._get_embedding_dimension()

        # Try Gemini
        if settings.PREFERRED_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    contents=text,
                    task_type="retrieval_document"
                )
                return result['embedding']
            except Exception as e:
                print(f"Gemini embedding generation failed: {e}")

        # Try OpenAI
        if settings.PREFERRED_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.embeddings.create(
                    input=[text],
                    model="text-embedding-3-small"
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"OpenAI embedding generation failed: {e}")

        # Fallback Mock Embedding (so app does not crash without API keys)
        print("Warning: API Key not set or failed. Using random fallback embedding.")
        dimension = self._get_embedding_dimension()
        # Seed based on text hash to keep it deterministic for identical text
        random.seed(hash(text))
        vector = [random.uniform(-0.1, 0.1) for _ in range(dimension)]
        # Normalize vector
        norm = sum(x**2 for x in vector)**0.5
        return [x/norm for x in vector] if norm > 0 else vector

    def index_user_profile(self, user_id: int, items: List[Dict[str, Any]]):
        """
        Uploads/updates profile items (experience, projects, skills, education) in Qdrant.
        items format: [{"id": str, "text": str, "metadata": dict}]
        """
        collection_name = "user_profiles"
        self._ensure_collection(collection_name)
        
        # First, delete existing points for this user to avoid stale profile records
        self.client.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    )
                ]
            )
        )
        
        points = []
        for index, item in enumerate(items):
            vector = self.get_embedding(item["text"])
            
            payload = {
                "user_id": user_id,
                "text": item["text"],
                **(item.get("metadata") or {})
            }
            
            # Use deterministic integer id for point
            # Python hash can be negative or larger than 64-bit int, so we create a simple combined key
            point_id = int(hash(f"{user_id}_{item['id']}") & 0xfffffff)
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )
            
        if points:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            print(f"Indexed {len(points)} profile items for user {user_id} in Qdrant.")

    def query_profile(self, user_id: int, query_text: str, limit: int = 5, item_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Queries Qdrant for items matching query_text.
        Allows filtering by user_id and item_type (e.g. "project", "experience").
        """
        collection_name = "user_profiles"
        self._ensure_collection(collection_name)
        
        query_vector = self.get_embedding(query_text)
        
        # Build payload filter
        must_conditions = [
            FieldCondition(
                key="user_id",
                match=MatchValue(value=user_id)
            )
        ]
        
        if item_type:
            must_conditions.append(
                FieldCondition(
                    key="type",
                    match=MatchValue(value=item_type)
                )
            )
            
        results = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=Filter(must=must_conditions),
            limit=limit
        )
        
        output = []
        for r in results:
            output.append({
                "score": r.score,
                "payload": r.payload
            })
            
        return output

rag_service = RAGService()
