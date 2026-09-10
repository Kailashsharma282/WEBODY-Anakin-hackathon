import math
import re
import logging
from typing import List, Dict, Any, Tuple
from collections import Counter

logger = logging.getLogger("webody.vector_memory")

class VectorMemoryService:
    """
    In-memory semantic vector store and cosine similarity search engine.
    Allows WEBODY to index scraped content, historical competitor changes,
    and research evidence for sub-millisecond contextual RAG retrieval.
    """

    def __init__(self):
        # In-memory document index: {doc_id: {"text": str, "vector": dict, "metadata": dict}}
        self.index: Dict[str, Dict[str, Any]] = {}
        self._seed_historical_memories()

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r"\w+", text.lower())
        # Filter stop words
        stops = {"the", "a", "an", "in", "on", "at", "to", "for", "with", "and", "or", "is", "was", "of"}
        return [w for w in words if w not in stops and len(w) > 2]

    def _vectorize(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        if not tokens:
            return {}
        counts = Counter(tokens)
        total = sum(counts.values())
        norm = math.sqrt(sum((c / total) ** 2 for c in counts.values()))
        if norm == 0:
            return {}
        return {term: (count / total) / norm for term, count in counts.items()}

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        intersection = set(vec1.keys()) & set(vec2.keys())
        return sum(vec1[x] * vec2[x] for x in intersection)

    def add_memory(self, doc_id: str, text: str, metadata: Dict[str, Any] = None):
        vector = self._vectorize(text)
        self.index[doc_id] = {
            "text": text,
            "vector": vector,
            "metadata": metadata or {}
        }

    def search(self, query: str, top_k: int = 4, threshold: float = 0.15) -> List[Dict[str, Any]]:
        query_vec = self._vectorize(query)
        if not query_vec:
            return []

        scored: List[Tuple[str, float]] = []
        for doc_id, entry in self.index.items():
            sim = self._cosine_similarity(query_vec, entry["vector"])
            if sim >= threshold:
                scored.append((doc_id, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        results = []
        for doc_id, sim in scored[:top_k]:
            entry = self.index[doc_id]
            results.append({
                "id": doc_id,
                "similarity": round(sim, 3),
                "text": entry["text"],
                "metadata": entry["metadata"]
            })
        return results

    def _seed_historical_memories(self):
        """Pre-seeds historical competitive market precedents for contextual reasoning."""
        memories = [
            (
                "mem-001",
                "Competitor X previously slashed basic tier pricing by 15% in Q4 2025 ahead of their Series B announcement.",
                {"entity": "Competitor X", "category": "PRICING", "quarter": "Q4-2025"}
            ),
            (
                "mem-002",
                "Competitor X bundled compliance audit tools for EU GDPR mandates before expanding enterprise sales team.",
                {"entity": "Competitor X", "category": "GOVERNANCE", "quarter": "Q1-2026"}
            ),
            (
                "mem-003",
                "AWS launched Bedrock guardrails compliance bundle at zero extra cost, forcing standalone compliance vendors to differentiate.",
                {"entity": "AWS", "category": "TECHNOLOGY", "quarter": "Q2-2026"}
            ),
            (
                "mem-004",
                "Acme AI enterprise customers renew with 94% retention when offered dedicated SOC2 Type II automated reporting.",
                {"entity": "Acme AI", "category": "CUSTOMERS", "quarter": "Q2-2026"}
            )
        ]
        for mid, txt, meta in memories:
            self.add_memory(mid, txt, meta)

vector_memory_service = VectorMemoryService()
