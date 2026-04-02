import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from detector import run_detection_pipeline

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/analyze-frame")
async def analyze_frame(frame: UploadFile = File(...)):
    try:
        data = await frame.read()
        if not data:
            return JSONResponse(
                status_code=200,
                content={"status": "error", "message": "empty body"},
            )
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse(
                status_code=200,
                content={"status": "error", "message": "could not decode image"},
            )
        status = run_detection_pipeline(img)
        return {"status": status}
    except Exception as e:
        return JSONResponse(
            status_code=200,
            content={"status": "error", "message": str(e)},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
