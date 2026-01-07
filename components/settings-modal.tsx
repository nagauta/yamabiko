import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Volume2 } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  onDeviceChange: (id: string) => void
  echoEnabled: boolean
  onEchoChange: (enabled: boolean) => void
  delayTime: number
  onDelayChange: (value: number[]) => void
  isRecording: boolean
}

export function SettingsModal({
  isOpen,
  onClose,
  devices,
  selectedDeviceId,
  onDeviceChange,
  echoEnabled,
  onEchoChange,
  delayTime,
  onDelayChange,
  isRecording
}: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-xl border-white/5 shadow-2xl relative z-50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-medium text-foreground">Audio Settings</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Input Device */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input Device</label>
            <Select
              value={selectedDeviceId}
              onValueChange={onDeviceChange}
              disabled={isRecording}
            >
              <SelectTrigger className="w-full bg-secondary/50 border-white/5 text-foreground hover:bg-secondary/80 focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/5 text-foreground shadow-xl max-w-[calc(100vw-4rem)]">
                {devices.map((device) => (
                  <SelectItem 
                    key={device.deviceId} 
                    value={device.deviceId}
                    className="focus:bg-primary/10 focus:text-primary cursor-pointer"
                  >
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isRecording && (
              <p className="text-xs text-amber-500/80">
                Stop monitoring to change input device
              </p>
            )}
          </div>

          {/* Echo Feedback */}
          <div className="space-y-4">
             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Playback</label>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-white/5 transition-colors hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-foreground">Echo Feedback</div>
                  <div className="text-xs text-muted-foreground">Hear your own voice</div>
                </div>
              </div>
              <Switch
                checked={echoEnabled}
                onCheckedChange={onEchoChange}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Latency */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latency</label>
              <span className="text-xs font-mono text-muted-foreground">
                {delayTime}ms
              </span>
            </div>
            <Slider
              value={[delayTime]}
              onValueChange={onDelayChange}
              min={0}
              max={2000}
              step={50}
              className="py-2"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

