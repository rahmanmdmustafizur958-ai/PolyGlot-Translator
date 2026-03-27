import React, { useState, useEffect, useRef } from 'react';

const LANGUAGES = [
  { code: 'fi', label: 'Finnish', speech: 'fi-FI' },
  { code: 'bn', label: 'Bangla', speech: 'bn-BD' },
  { code: 'fa', label: 'Persian', speech: 'fa-IR' },
];

function App() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to translate.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=en|${targetLang.code}`
      );
      const data = await response.json();
      if (data.responseData) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        setError('Translation failed. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to translation service.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      // Optional: Show a "Copied!" toast
    }
  };

  const speak = (text, langCode) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  return (
    <div className="container">
      <h1>PolyGlot</h1>
      
      <div className="translator-grid">
        {/* Input Section */}
        <div className="input-section">
          <label>
            English
            <button 
              className={`btn-icon ${isRecording ? 'recording-pulse' : ''}`} 
              onClick={startRecording}
              title="Speak in English"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
          </label>
          <textarea 
            placeholder="Type something in English..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
        </div>

        {/* Middle Controls */}
        <div className="controls">
          <select 
            className="lang-select" 
            value={targetLang.code}
            onChange={(e) => setTargetLang(LANGUAGES.find(l => l.code === e.target.value))}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>

          <button className="btn btn-primary" onClick={handleTranslate} disabled={isLoading}>
            {isLoading ? (
              <div className="spinner" style={{width: '20px', height: '20px', borderSize: '2px'}}></div>
            ) : (
              <>
                Translate
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && <div style={{color: '#ef4444', fontSize: '0.9rem', textAlign: 'center'}}>{error}</div>}

        {/* Output Section */}
        <div className="output-section">
          <label>
            {targetLang.label}
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="btn-icon" onClick={handleCopy} title="Copy Translation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button 
                className="btn-icon" 
                onClick={() => speak(translatedText, targetLang.speech)}
                title="Listen to Translation"
                disabled={!translatedText}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            </div>
          </label>
          <div className="translated-text">
            {isLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              translatedText || <span style={{color: '#94a3b8'}}>Translation will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
