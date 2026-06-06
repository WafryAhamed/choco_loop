import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

// Resolve the vendor-prefixed SpeechRecognition constructor
function getRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null);

}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const RecognitionCtor = getRecognition();
  const isSupported = !!RecognitionCtor;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isSupported) return;
    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setTranscript((prev) => (prev ? prev + ' ' : '') + final.trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
<<<<<<< HEAD
      console.error('[Speech Recognition] Error:', event.error);
=======
<<<<<<< HEAD
=======
      console.error('[Speech Recognition] Error:', event.error);
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setError(
<<<<<<< HEAD
=======
<<<<<<< HEAD
          'Microphone access denied. Enable it in your browser settings.'
        );
      } else {
        setError(`Recognition error: ${event.error}`);
=======
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
          'Microphone access denied. Please allow microphone in browser permissions and reload the page.'
        );
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Recognition error: ${event.error}. Please try again.`);
<<<<<<< HEAD
=======
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
      }
      setIsListening(false);
    };

    recognition.onend = () => {
<<<<<<< HEAD
      console.log('[Speech Recognition] Session ended');
=======
<<<<<<< HEAD
=======
      console.log('[Speech Recognition] Session ended');
>>>>>>> fix-camera
>>>>>>> 6a0304bb03f877fde527fa11a075f5024efd09c6
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {

        /* noop */}
    };
  }, [isSupported, RecognitionCtor]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
<<<<<<< HEAD
      setError('Voice recognition is not supported in this browser.');
      return;
    }
    setError(null);
    setInterimTranscript('');
=======
      const msg = 'Voice recognition is not supported in this browser.';
      console.error('[Speech Recognition]', msg);
      setError(msg);
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    console.log('[Speech Recognition] Starting...');
>>>>>>> fix-camera
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
<<<<<<< HEAD

      // start() throws if already started — ignore
    }}, [isSupported]);

  const stopListening = useCallback(() => {
=======
      console.error('[Speech Recognition] Start error:', e);
      // start() throws if already started — ignore
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    console.log('[Speech Recognition] Stopping...');
>>>>>>> fix-camera
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
<<<<<<< HEAD

        /* noop */}
=======
        console.error('[Speech Recognition] Stop error:', e);
        /* noop */
      }
>>>>>>> fix-camera
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error
  };
}

// Speak text back using the browser SpeechSynthesis API
export function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {

    /* noop */}
}