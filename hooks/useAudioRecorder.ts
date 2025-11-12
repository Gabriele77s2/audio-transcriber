
import { useState, useRef, useCallback } from 'react';

type AudioRecorderHook = {
  isRecording: boolean;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  recordingTime: number;
};

export const useAudioRecorder = (onRecordingStop: (blob: Blob) => void): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingStop(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
      };

      recorder.start();
      
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      return true;

    } catch (err) {
      console.error("Error starting recording:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
          alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
      } else {
          alert("Could not start recording. Please ensure you have a microphone connected and have granted permission.");
      }
      setIsRecording(false);
      return false;
    }
  }, [onRecordingStop]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { isRecording, startRecording, stopRecording, recordingTime };
};
