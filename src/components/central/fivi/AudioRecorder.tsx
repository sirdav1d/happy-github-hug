import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Pause, Play, Trash2, AlertCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AudioRecorder = ({ 
  onRecordingComplete, 
  onClear, 
  disabled = false,
  className 
}: AudioRecorderProps) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Notify parent when recording is complete
  useEffect(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, onRecordingComplete]);

  const handleClear = () => {
    clearRecording();
    onClear();
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  // Max recording time: 10 minutes
  const maxTime = 10 * 60;
  const progress = (recordingTime / maxTime) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Recording state - not recording yet */}
      {!isRecording && !audioUrl && (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          disabled={disabled}
          className="w-full justify-center gap-2 h-16 border-dashed hover:border-violet-500 hover:bg-violet-500/5 transition-colors"
        >
          <div className="p-2 rounded-full bg-violet-500/10">
            <Mic className="h-5 w-5 text-violet-500" />
          </div>
          <span className="text-muted-foreground">Clique para gravar a FIVI</span>
        </Button>
      )}

      {/* Active recording */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-rose-500/10 border border-violet-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Pulsing indicator */}
                <div className="relative">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isPaused ? "bg-amber-500" : "bg-rose-500"
                  )} />
                  {!isPaused && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-rose-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className="text-sm font-medium">
                  {isPaused ? 'Pausado' : 'Gravando...'}
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-foreground">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-secondary mb-4 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  isPaused ? "bg-amber-500" : "bg-violet-500"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Pause/Resume */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="h-10 w-10 rounded-full"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>

              {/* Stop */}
              <Button
                type="button"
                onClick={stopRecording}
                className="h-12 w-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Square className="h-5 w-5 fill-current" />
              </Button>

              {/* Cancel */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-3">
              Máximo 10 minutos • {formatTime(maxTime - recordingTime)} restantes
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recorded audio preview */}
      <AnimatePresence>
        {audioUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
          >
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={togglePlayback}
                className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Gravação concluída
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3" />
                  <span>{formatTime(recordingTime)}</span>
                  <span>•</span>
                  <span>{(audioBlob?.size || 0 / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <audio ref={audioRef} src={audioUrl} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioRecorder;
