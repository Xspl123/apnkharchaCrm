import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import StopIcon from "@mui/icons-material/Stop";
import useSpeechToText from "../hooks/useSpeechToText";

const SpeechFieldButton = ({ onTranscript, tooltip = "Bolkar fill karo", size = "small" }) => {
  const { supported, isListening, startListening, stopListening } = useSpeechToText();

  if (!supported) {
    return null;
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening({
      onResult: (transcript) => onTranscript?.(transcript),
    });
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton size={size} onClick={handleClick} edge="end">
        {isListening ? <StopIcon fontSize="inherit" /> : <KeyboardVoiceIcon fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};

export default SpeechFieldButton;
