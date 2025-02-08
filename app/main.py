import cv2
import numpy as np
from fastapi import FastAPI, WebSocket
import base64
import re

from hand_detection import run_hand_tracking_server

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"Client connected: {websocket.client_state}")
    try:
        while True:
            message = await websocket.receive_text()

            match = re.match(r"^data:image/jpeg;base64,(.*)$", message) # Match JPEG format
            if match:
                base64_string = match.group(1)
                img_bytes = base64.b64decode(base64_string)
                nparr = np.frombuffer(img_bytes, np.uint8)

                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)  # Decode as JPEG

                if img is not None:
                    print("show image")
                    run_hand_tracking_server(img)
                    # cv2.imshow("Webcam Stream", img)
                    # if cv2.waitKey(1) & 0xFF == ord('q'):
                    #     break
                else:
                    print("Error decoding JPEG frame")  # Correct error message

            else:
                print(f"Incorrect format: {message[:50]}...")

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        cv2.destroyAllWindows()
        print(f"Client disconnected: {websocket.client_state}")
        await websocket.close()

# ... (Run FastAPI app)