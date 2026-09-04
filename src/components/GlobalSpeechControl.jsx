import { useState } from "react";
import { Alert, Fab, Snackbar, Tooltip } from "@mui/material";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import StopIcon from "@mui/icons-material/Stop";
import useSpeechToText from "../hooks/useSpeechToText";

const GlobalSpeechControl = () => {
  const { supported, isListening, dictateToActiveElement, stopListening } =
    useSpeechToText();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  if (!supported) {
    return null;
  }

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
      showSnackbar("Voice typing stopped.", "info");
      return;
    }

    dictateToActiveElement({
      onSuccess: () =>
        showSnackbar("Voice text field mein add ho gaya.", "success"),
      onError: (message) => showSnackbar(message, "warning"),
    });
  };

  return (
    <>
      <Tooltip title="Focus input karke mic dabao aur bolo">
        <Fab
          color={isListening ? "error" : "primary"}
          onClick={handleClick}
          sx={{
            position: "fixed",
            right: 24,
            bottom: 32,
            zIndex: 1400,
          }}
        >
          {isListening ? <StopIcon /> : <KeyboardVoiceIcon />}
        </Fab>
      </Tooltip>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GlobalSpeechControl;
