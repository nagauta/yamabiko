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
      <Card className="w-full max-w-md bg-[#1C1C1E] border-white/10 shadow-2xl relative z-50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-medium text-white">Audio Settings</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Input Device */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Input Device</label>
            <Select
              value={selectedDeviceId}
              onValueChange={onDeviceChange}
              disabled={isRecording}
            >
              <SelectTrigger className="w-full bg-black/20 border-white/10 text-white hover:bg-white/5 focus:ring-0 focus:border-white/20">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                {devices.map((device) => (
                  <SelectItem 
                    key={device.deviceId} 
                    value={device.deviceId}
                    className="focus:bg-white/10 focus:text-white cursor-pointer"
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
             <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Playback</label>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-white">Echo Feedback</div>
                  <div className="text-xs text-zinc-500">Hear your own voice</div>
                </div>
              </div>
              <Switch
                checked={echoEnabled}
                onCheckedChange={onEchoChange}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>

          {/* Latency */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Latency</label>
              <span className="text-xs font-mono text-zinc-400">
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

