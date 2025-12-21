import { useState, useEffect, useRef, useCallback } from 'react';
import { speechService } from '../services/speechService';

/**
 * Custom hook for speech recognition
 * Abstracts speech recognition logic and provides easy-to-use interface
 */
export const useSpeechRecognition = (options = {}) => {
  const {
    autoStart = false,
    onTranscript,
    onError,
    continuous = false
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(null);

  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  // Check browser support on mount
  useEffect(() => {
    const supported = speechService.getSupported();
    setIsSupported(supported);

    // Check permissions
    if (supported) {
      checkPermissions();
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      const result = await speechService.checkPermissions();
      setPermissionGranted(result.granted);
      if (!result.granted && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError('Failed to check microphone permissions');
      setPermissionGranted(false);
      return { granted: false, error: err.message };
    }
  }, []);

  const startListening = useCallback(async () => {
    // Check permissions first if not already checked or denied
    if (permissionGranted === false || permissionGranted === null) {
      const result = await checkPermissions();
      if (!result.granted) {
        setError(result.error || 'Microphone permission required');
        onErrorRef.current?.(new Error(result.error || 'Microphone permission required'));
        return;
      }
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);

    speechService.start({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (finalTranscript) => {
        setTranscript(finalTranscript);
        setInterimTranscript('');
        onTranscriptRef.current?.(finalTranscript);
        
        // Auto-stop if not continuous
        if (!continuous) {
          setIsListening(false);
        }
      },
      onInterimResult: (interim) => {
        setInterimTranscript(interim);
      },
      onError: (err) => {
        console.error('Speech recognition error:', err);
        setError(err.message);
        setIsListening(false);
        onErrorRef.current?.(err);
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript('');
      }
    });
  }, [permissionGranted, continuous, checkPermissions]);

  const stopListening = useCallback(() => {
    speechService.stop();
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const abortListening = useCallback(() => {
    speechService.abort();
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isSupported && permissionGranted) {
      startListening();
    }
  }, [autoStart, isSupported, permissionGranted, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortListening();
    };
  }, [abortListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    permissionGranted,
    startListening,
    stopListening,
    abortListening,
    checkPermissions
  };
};

