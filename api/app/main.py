import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket
import base64
import re

from app.hand_detection import run_hand_tracking_server
from fastapi.staticfiles import StaticFiles

app = FastAPI()

def decode_text_to_jpeg(message: str):
    match = re.match(r"^data:image/jpeg;base64,(.*)$", message)
    if not match: return

    base64_string = match.group(1)
    img_bytes = base64.b64decode(base64_string)
    nparray = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparray, cv2.IMREAD_COLOR)  # Decode as JPEG
    return img

def encode_jpeg_to_text(frame):
    ret, encoded_img = cv2.imencode('.jpg', frame)  # Encode as JPEG
    if ret:
        img_bytes = encoded_img.tobytes()
        base64_string = base64.b64encode(img_bytes).decode('utf-8')
        data_url = f"data:image/jpeg;base64,{base64_string}"
        return data_url

@app.websocket("/websocket")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"Client connected: {websocket.client_state}")
    try:
        while True:
            message = await websocket.receive_text()

            img = decode_text_to_jpeg(message)
            if img is None:
                print("[ error ] invalid image")
                continue
            frame = run_hand_tracking_server(img)
            data_url = encode_jpeg_to_text(frame)
            await websocket.send_text(data_url)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        cv2.destroyAllWindows()
        print(f"Client disconnected: {websocket.client_state}")
    try:
        await websocket.close()
        print("[ info ] websocket is closed")
    except RuntimeError:
        print("[ error ] client closed the socket")

app.mount("/", StaticFiles(directory=r"static", html=True), name="/")

if __name__ == "__main__":
    uvicorn.run("app.main:app", port=5000, log_level="info")