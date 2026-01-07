"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, Settings2, BarChart3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SettingsModal } from "./settings-modal"

export default function MicChecker() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string>("")
  const [echoEnabled, setEchoEnabled] = useState(false)
  const [delayTime, setDelayTime] = useState(300)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const delayNodeRef = useRef<DelayNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)

  // マイクデバイスの一覧を取得
  useEffect(() => {
    const getDevices = async () => {
      try {
        // 許可を求める前にデバイス一覧だけ取得してみる（許可済みの場合）
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = deviceList.filter(device => device.kind === "audioinput")
        setDevices(audioInputs)
        
        if (audioInputs.length > 0 && !selectedDeviceId) {
           // 最初のデバイスを選択（ラベルがない場合もあるがIDは取れる）
           setSelectedDeviceId(audioInputs[0].deviceId)
        }
      } catch (err) {
        console.error("Error enumerating devices:", err)
      }
    }

    getDevices()
    navigator.mediaDevices.addEventListener("devicechange", getDevices)
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices)
    }
  }, [selectedDeviceId])

  // オーディオレベルを計測
  const measureAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const normalizedLevel = Math.min(100, (average / 255) * 100 * 2.5) // 感度を少し上げる

    setAudioLevel(normalizedLevel)
    animationFrameRef.current = requestAnimationFrame(measureAudioLevel)
  }

  // 録音開始
  const startRecording = async () => {
    try {
      setError("")
      
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // 権限取得後にデバイス名を再取得（初回起動時はラベルが空のため）
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      setDevices(deviceList.filter(device => device.kind === "audioinput"))

      mediaStreamRef.current = stream

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 64 // バーの本数に合わせて調整
      analyserRef.current.smoothingTimeConstant = 0.8

      delayNodeRef.current = audioContextRef.current.createDelay(5.0)
      delayNodeRef.current.delayTime.value = delayTime / 1000
      
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = echoEnabled ? 1.0 : 0.0

      const source = audioContextRef.current.createMediaStreamSource(stream)
      sourceNodeRef.current = source

      source.connect(analyserRef.current)
      source.connect(delayNodeRef.current)
      delayNodeRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(audioContextRef.current.destination)

      setIsRecording(true)
      measureAudioLevel()
    } catch (err) {
      setError("マイクの起動に失敗しました。設定を確認してください。")
      console.error("Error starting recording:", err)
    }
  }

  // 録音停止
  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    if (delayNodeRef.current) {
      delayNodeRef.current.disconnect()
      delayNodeRef.current = null
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect()
      gainNodeRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    analyserRef.current = null
    setIsRecording(false)
    setAudioLevel(0)
  }

  const toggleEcho = (enabled: boolean) => {
    setEchoEnabled(enabled)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enabled ? 1.0 : 0.0
    }
  }

  const updateDelay = (value: number[]) => {
    const newDelay = value[0]
    setDelayTime(newDelay)
    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.value = newDelay / 1000
    }
  }

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto aspect-video flex flex-col relative bg-[#121214] rounded-xl border border-white/5 shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
        <div className="flex flex-col">
          <h1 className="text-sm font-medium text-zinc-400 tracking-wide">SIGNAL MONITOR</h1>
          {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* Center Status / Level */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Glowing Background Ring */}
          <div 
            className={cn(
              "absolute w-64 h-64 rounded-full transition-all duration-300 ease-out blur-3xl opacity-20",
              isRecording ? "bg-purple-500" : "bg-zinc-800"
            )}
            style={{ transform: `scale(${1 + audioLevel / 100})` }}
          />

          {/* Main Indicator */}
          <div className="relative z-10 flex flex-col items-center gap-4">
             <div 
               className={cn(
                 "w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-300",
                 isRecording 
                   ? "border-purple-500/50 bg-purple-500/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]" 
                   : "border-zinc-700 bg-zinc-800/50"
               )}
             >
                {isRecording ? (
                   <Mic className={cn("h-8 w-8 text-purple-400", audioLevel > 50 && "animate-pulse")} />
                ) : (
                   <MicOff className="h-8 w-8 text-zinc-600" />
                )}
             </div>
             <div className="text-center">
                <div className="text-3xl font-light text-white font-mono">
                  {isRecording ? `${Math.round(audioLevel)}%` : "--"}
                </div>
             </div>
          </div>
        </div>

        {/* Frequency Bars */}
        <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-sm px-4">
           {[...Array(20)].map((_, i) => {
             // Simple simulation of frequency data visualization based on single level for now
             // In a real app, we'd use getByteFrequencyData per bin
             const heightMod = Math.sin(i * 0.5) * 0.5 + 0.5
             const height = isRecording 
                ? Math.max(4, (audioLevel * heightMod * (0.5 + Math.random() * 0.5)))
                : 4
             
             return (
               <div
                 key={i}
                 className={cn(
                   "w-2 rounded-full transition-all duration-75",
                   isRecording ? "bg-zinc-400" : "bg-zinc-800"
                 )}
                 style={{ 
                   height: `${height}%`,
                   opacity: isRecording ? 0.5 + (height / 100) * 0.5 : 0.3
                 }}
               />
             )
           })}
        </div>

      </div>

      {/* Bottom Controls */}
      <div className="p-8 flex justify-center z-20">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          size="lg"
          className={cn(
            "h-12 px-8 rounded-full font-medium transition-all duration-300 border",
            isRecording 
              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40" 
              : "bg-white text-black border-transparent hover:bg-zinc-200"
          )}
        >
          {isRecording ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Stop Monitoring
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Loader2 className={cn("w-4 h-4", error ? "text-red-500" : "hidden")} />
              Start Monitoring
            </span>
          )}
        </Button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={setSelectedDeviceId}
        echoEnabled={echoEnabled}
        onEchoChange={toggleEcho}
        delayTime={delayTime}
        onDelayChange={updateDelay}
        isRecording={isRecording}
      />
    </div>
  )
}
