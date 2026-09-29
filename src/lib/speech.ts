import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type Ctor = new () => SpeechRecognitionLike;

function getCtor(): Ctor | null {
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = () => typeof window !== 'undefined' && getCtor() !== null;

/** Rozpoznávání řeči v češtině (Web Speech API) */
export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const wantListening = useRef(false);

  useEffect(() => () => {
    wantListening.current = false;
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const C = getCtor();
    if (!C) {
      setError('Tento prohlížeč nepodporuje rozpoznávání řeči. Zkus Chrome nebo Edge.');
      return;
    }
    setError(null);
    const r = new C();
    r.lang = 'cs-CZ';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onFinalRef.current(res[0].transcript.trim());
        else interimText += res[0].transcript;
      }
      setInterim(interimText);
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Přístup k mikrofonu byl zamítnut.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError(`Chyba rozpoznávání: ${e.error}`);
    };
    r.onend = () => {
      // Prohlížeč ukončuje nahrávání po pauze – pokud uživatel nahrávání nezastavil, pokračujeme
      if (wantListening.current) {
        try {
          r.start();
          return;
        } catch {
          /* nelze znovu spustit */
        }
      }
      setListening(false);
      setInterim('');
    };
    rec.current = r;
    wantListening.current = true;
    try {
      r.start();
      setListening(true);
    } catch {
      setError('Nahrávání se nepodařilo spustit.');
    }
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    rec.current?.stop();
    setListening(false);
  }, []);

  return { listening, interim, error, start, stop, supported: speechSupported() };
}
