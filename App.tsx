
import React, { useState, useCallback, useRef } from 'react';
import { AppState } from './types';
import { transcribeAudio } from './services/geminiService';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { Icon } from './components/Icon';
import { Spinner } from './components/Spinner';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// UI Components (defined outside App to prevent re-renders)

type WelcomeScreenProps = {
  onStartRecording: () => void;
  onFileUpload: () => void;
};
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartRecording, onFileUpload }) => (
  <div className="text-center">
    <h2 className="text-2xl font-semibold text-gray-200 mb-6">How would you like to start?</h2>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        onClick={onStartRecording}
        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
      >
        <Icon type="microphone" className="w-6 h-6" />
        Record Audio
      </button>
      <button
        onClick={onFileUpload}
        className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
      >
        <Icon type="upload" className="w-6 h-6" />
        Upload a File
      </button>
    </div>
  </div>
);

type RecordingScreenProps = {
    onStopRecording: () => void;
    recordingTime: number;
};
const RecordingScreen: React.FC<RecordingScreenProps> = ({ onStopRecording, recordingTime }) => (
    <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 bg-red-500 rounded-full animate-ping"></div>
            <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white font-mono text-2xl tracking-wider">
                {formatTime(recordingTime)}
            </div>
        </div>
        <button
            onClick={onStopRecording}
            className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg"
        >
            <Icon type="stop" className="w-6 h-6" />
            Stop Recording
        </button>
    </div>
);

type ResultScreenProps = {
    transcription: string;
    onReset: () => void;
};
const ResultScreen: React.FC<ResultScreenProps> = ({ transcription, onReset }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(transcription);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                     <h2 className="text-xl font-semibold text-gray-200">Transcription Result</h2>
                     <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                        disabled={copied}
                    >
                        {copied ? <><Icon type="check" className="w-4 h-4" /> Copied!</> : <><Icon type="copy" className="w-4 h-4" /> Copy</>}
                    </button>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg min-h-[200px] max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-gray-300 font-mono ring-1 ring-white/10">
                    {transcription}
                </div>
            </div>
            <button
                onClick={onReset}
                className="self-center flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
                Transcribe Another
            </button>
        </div>
    );
};

type ErrorScreenProps = {
    error: string;
    onReset: () => void;
};
const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onReset }) => (
    <div className="text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold text-red-400">An Error Occurred</h2>
        <p className="bg-red-900/50 text-red-300 p-3 rounded-md max-w-md">{error}</p>
        <button
            onClick={onReset}
            className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg mt-4"
        >
            <Icon type="retry" className="w-5 h-5" />
            Try Again
        </button>
    </div>
);


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioSubmit = useCallback(async (audioBlob: Blob) => {
    setAppState(AppState.PROCESSING);
    try {
      const result = await transcribeAudio(audioBlob);
      setTranscription(result);
      setAppState(AppState.SUCCESS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setAppState(AppState.ERROR);
    }
  }, []);

  const { isRecording, startRecording, stopRecording, recordingTime } = useAudioRecorder(handleAudioSubmit);
  
  const handleStartRecording = async () => {
      const success = await startRecording();
      if(success) {
          setAppState(AppState.RECORDING);
      }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        handleAudioSubmit(file);
      } else {
        alert('Please select a valid audio file.');
      }
    }
    // Reset file input value to allow selecting the same file again
    event.target.value = '';
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setTranscription('');
    setError('');
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.RECORDING:
        return <RecordingScreen onStopRecording={stopRecording} recordingTime={recordingTime} />;
      case AppState.PROCESSING:
        return <Spinner message="Processing your audio, please wait..." />;
      case AppState.SUCCESS:
        return <ResultScreen transcription={transcription} onReset={reset} />;
      case AppState.ERROR:
        return <ErrorScreen error={error} onReset={reset} />;
      case AppState.IDLE:
      default:
        return <WelcomeScreen onStartRecording={handleStartRecording} onFileUpload={triggerFileUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
        <main className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center flex-grow">
            <header className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                    Audio Transcriber
                </h1>
                <p className="text-gray-400 mt-2">Powered by Google Gemini</p>
            </header>
            <div className="w-full bg-gray-800/40 backdrop-blur-sm p-8 rounded-2xl shadow-2xl ring-1 ring-white/10 min-h-[250px] flex items-center justify-center">
                {renderContent()}
            </div>
        </main>
        <footer className="text-center text-gray-500 text-sm p-4">
            Built by a world-class senior frontend React engineer.
        </footer>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
        />
    </div>
  );
};

export default App;
