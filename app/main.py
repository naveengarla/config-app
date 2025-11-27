from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import namespaces, schemas, configs, reference_data

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Generic Configuration Service")

# Include routers
app.include_router(namespaces.router)
app.include_router(schemas.router)
app.include_router(configs.router)
app.include_router(reference_data.router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')
