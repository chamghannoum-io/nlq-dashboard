/**
 * Speech Service - Abstraction layer for speech recognition
 * Currently uses Web Speech API, but can be swapped for Whisper API later
 */

class WebSpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.init();
  }

  init() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      this.isSupported = false;
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
      
      // Configure recognition settings
      this.recognition.continuous = false; // Stop after first result
      this.recognition.interimResults = true; // Get interim results for real-time feedback
      this.recognition.lang = 'en-US'; // Can be made configurable
      this.recognition.maxAlternatives = 1;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      this.isSupported = false;
    }
  }

  /**
   * Start recognition
   * @param {Object} callbacks - { onResult, onError, onStart, onEnd, onInterimResult }
   */
  start(callbacks = {}) {
    if (!this.isSupported || !this.recognition) {
      callbacks.onError?.(new Error('Speech recognition not supported'));
      return;
    }

    // Set up event listeners
    this.recognition.onstart = () => {
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Call interim callback for real-time feedback
      if (interimTranscript) {
        callbacks.onInterimResult?.(interimTranscript);
      }

      // Call final result callback
      if (finalTranscript) {
        callbacks.onResult?.(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      const error = new Error(event.error);
      callbacks.onError?.(error);
    };

    this.recognition.onend = () => {
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (error) {
      // Already started - ignore
      if (error.message !== 'recognition has already started') {
        callbacks.onError?.(error);
      }
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when stopping
        console.warn('Error stopping recognition:', error);
      }
    }
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.warn('Error aborting recognition:', error);
      }
    }
  }

  getSupported() {
    return this.isSupported;
  }

  // Check if microphone permission is needed (Web Speech API doesn't expose this directly)
  async checkPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return { granted: false, error: 'Permission denied' };
      }
      if (error.name === 'NotFoundError') {
        return { granted: false, error: 'No microphone found' };
      }
      return { granted: false, error: error.message };
    }
  }
}

/**
 * Future: Whisper API Service (commented structure for easy swap)
 * 
 * class WhisperRecognitionService {
 *   async start(audioBlob, callbacks) {
 *     // Upload audio to your webhook
 *     // /webhook/speech-to-text
 *     // Returns transcription
 *   }
 * }
 */

// Export singleton instance
export const speechService = new WebSpeechRecognitionService();

