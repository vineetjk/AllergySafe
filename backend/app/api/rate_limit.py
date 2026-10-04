"""Small in-memory rate limiter for endpoints that spend paid API credits."""
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, per_client: int, per_client_window_s: int, global_limit: int, global_window_s: int):
        self.per_client = per_client
        self.per_client_window = per_client_window_s
        self.global_limit = global_limit
        self.global_window = global_window_s
        self.clients: Dict[str, Deque[float]] = defaultdict(deque)
        self.all: Deque[float] = deque()

    @staticmethod
    def _client_id(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    @staticmethod
    def _trim(q: Deque[float], window: int, now: float) -> None:
        while q and now - q[0] > window:
            q.popleft()

    def check(self, request: Request) -> None:
        now = time.monotonic()
        client = self.clients[self._client_id(request)]
        self._trim(client, self.per_client_window, now)
        self._trim(self.all, self.global_window, now)
        if len(client) >= self.per_client or len(self.all) >= self.global_limit:
            raise HTTPException(status_code=429, detail="Too many voice requests. Please wait a few minutes and try again.")
        client.append(now)
        self.all.append(now)
        # Keep memory bounded if many different clients appear.
        if len(self.clients) > 5000:
            for key in [k for k, q in self.clients.items() if not q][:2500]:
                del self.clients[key]


# ElevenLabs text-to-speech and speech-to-text use the owner's paid credits.
voice_limiter = RateLimiter(per_client=12, per_client_window_s=600, global_limit=150, global_window_s=3600)
