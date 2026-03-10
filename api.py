import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from data_processor import DataScanner, DataNormalizer
import tempfile

app = FastAPI()

# Configurar CORS para que React (localhost:5173) pueda hablar con esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar a los dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = DataScanner()
normalizer = DataNormalizer()

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    # Guardar archivo temporal para que DataScanner lo procese
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name

    report_lines = []
    def log_capture(text):
        report_lines.append(text)

    try:
        df = scanner.generar_reporte_markdown(tmp_path, log_capture)
        report_md = "\n".join(report_lines)
        
        return {
            "filename": file.filename,
            "report_md": report_md,
            "has_df": df is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Sala de Situacion Data API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
