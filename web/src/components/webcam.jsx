"use client";
import React, { useRef, useEffect, useState } from 'react';
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils";

const Webcam = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null); // Add canvas ref
    const websocket = useRef(null);
    const intervalId = useRef(null);
    const [processedStream, setProcessedStream] = useState(null); // State for processed stream URL

    const startCamera = async () => {
        try {


            websocket.current = new WebSocket('/websocket');
            // websocket.current = new WebSocket('ws://127.0.0.1:8000/websocket');

            websocket.current.onopen = async () => {
                toast.success("Connected to websocket", {
                    position: 'top-right',
                    description: "client is connected to server succesfully",
                })
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                intervalId.current = setInterval(sendFrame, 300); // Adjust frame rate (milliseconds)

            };

            websocket.current.onerror = (error) => {
                toast.error("websocket error", {
                    position: 'top-right',
                    description: error.message,
                })
            };

            websocket.current.onclose = () => {
                toast.error("websocket connection closed", {
                    position: 'top-right',
                })
            };

            websocket.current.onmessage = (event) => {
                setProcessedStream(event.data);
            };

            const sendFrame = () => {
                if (!(websocket.current && websocket.current.readyState === WebSocket.OPEN)) {
                    console.log("WebSocket is not open. Cannot send frame.");
                    return
                } 
                const canvas = canvasRef.current;
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result;
                        websocket.current.send(base64String);
                    };
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', 0.8); // JPEG quality 0.8
            };


        } catch (error) {
            console.error('Error obtaining camera stream: ', error);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }

        if (websocket.current) {
            websocket.current.close();
        }
        if (intervalId.current) {
            clearInterval(intervalId.current); // Clear the interval
            intervalId.current = null; // Reset the ref
        }
        setProcessedStream(null)
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className=' h-screen w-screen bg-black flex justify-center items-center'>
            <div className=' container h-full flex flex-col z-10'>
                <h1 className='text-white text-center text-[30px]'>Hand Detection</h1>

                <div className='grow border border-gray-700 flex justify-center items-center'>
                    <video className='w-full h-full' ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }}></video>
                    <canvas className='w-full h-full' ref={canvasRef} style={{ display: 'none' }}></canvas>
                    {processedStream && (  // Conditionally render the processed stream
                        <img src={processedStream} alt="Processed Stream" />
                    )}
                </div>
                <div className='flex justify-center items-center gap-10 my-5'>
                    <Button className="w-40 z-10 " variant="outline" onClick={startCamera}>Initiate</Button>
                    <Button className="w-40 z-10" variant="destructive" onClick={stopCamera}>Terminate</Button>
                </div>

            </div>
            <BackgroundBeams />
        </div>

    );
};

export default Webcam;