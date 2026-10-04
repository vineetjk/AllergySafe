from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Food safety and healthy-eating assistant built for a friend.",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None
)

# The web app calls the API through its own /api proxy, so browsers never need
# cross-origin access. Only explicitly configured origins are allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "Welcome to AllergySafe Table API",
        "docs_url": "/docs",
        "open_source_core": True,
        "friend": "Prithvi"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
