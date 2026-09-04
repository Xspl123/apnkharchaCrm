import { useCallback, useMemo, useRef, useState } from "react";

const getRecognitionConstructor = () =>
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const isEditableElement = (element) => {
  if (!element) {
    return false;
  }

  const tagName = element.tagName?.toLowerCase();
  const editableTypes = ["text", "search", "email", "number", "tel", "url"];

  return (
    tagName === "textarea" ||
    (tagName === "input" && editableTypes.includes(element.type || "text")) ||
    element.isContentEditable
  );
};

const dispatchInputEvents = (element) => {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

const appendTranscriptToElement = (element, transcript) => {
  if (!isEditableElement(element)) {
    return false;
  }

  if (element.isContentEditable) {
    const prefix = element.textContent?.trim() ? " " : "";
    element.textContent = `${element.textContent || ""}${prefix}${transcript}`.trim();
    dispatchInputEvents(element);
    return true;
  }

  const prefix = element.value?.trim() ? " " : "";
  const nextValue = `${element.value || ""}${prefix}${transcript}`.trim();
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  const textAreaSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  if (element.tagName?.toLowerCase() === "textarea") {
    textAreaSetter?.call(element, nextValue);
  } else {
    nativeSetter?.call(element, nextValue);
  }

  dispatchInputEvents(element);
  return true;
};

const useSpeechToText = () => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState("");
  const supported = useMemo(() => Boolean(getRecognitionConstructor()), []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    ({ onResult, onError, lang = "en-US" } = {}) => {
      const Recognition = getRecognitionConstructor();

      if (!Recognition) {
        const message = "Speech recognition is not supported in this browser.";
        setError(message);
        onError?.(message);
        return;
      }

      recognitionRef.current?.stop();

      const recognition = new Recognition();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setError("");
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();

        setLastTranscript(transcript);
        onResult?.(transcript, event);
      };

      recognition.onerror = (event) => {
        const message =
          event.error === "no-speech"
            ? "No speech detected. Please try again."
            : `Speech recognition failed: ${event.error}`;

        setError(message);
        onError?.(message, event);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    []
  );

  const dictateToActiveElement = useCallback(
    ({ onSuccess, onError, lang } = {}) => {
      const activeElement = document.activeElement;

      if (!isEditableElement(activeElement)) {
        const message = "Voice typing ke liye pehle koi input ya search field focus karo.";
        setError(message);
        onError?.(message);
        return;
      }

      startListening({
        lang,
        onResult: (transcript) => {
          const inserted = appendTranscriptToElement(activeElement, transcript);

          if (!inserted) {
            const message = "Selected field voice input support nahi karta.";
            setError(message);
            onError?.(message);
            return;
          }

          onSuccess?.(transcript);
        },
        onError,
      });
    },
    [startListening]
  );

  return {
    supported,
    isListening,
    lastTranscript,
    error,
    startListening,
    stopListening,
    dictateToActiveElement,
  };
};

export default useSpeechToText;
