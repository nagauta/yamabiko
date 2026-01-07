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
  const [echoEnabled, setEchoEnabled] = useState(true)
  const [delayTime, setDelayTime] = useState(300)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [audioInfo, setAudioInfo] = useState<{ sampleRate: number; channelCount: number; label: string } | null>(null)

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

  // 内部リソースのクリーンアップ
  const cleanupAudio = () => {
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
  }

  // オーディオセットアップ
  const setupAudio = async (deviceId: string) => {
    try {
      cleanupAudio()
      setError("")

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // 権限取得後にデバイス名を再取得
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = deviceList.filter(device => device.kind === "audioinput")
      setDevices(audioInputs)

      // ストリームの設定情報を取得
      const audioTrack = stream.getAudioTracks()[0]
      const settings = audioTrack.getSettings()

      setAudioInfo({
        sampleRate: settings.sampleRate || 48000,
        channelCount: settings.channelCount || 1,
        label: audioTrack.label || "Unknown Microphone"
      })

      mediaStreamRef.current = stream

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 64
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

      measureAudioLevel()
    } catch (err) {
      setError("マイクの起動に失敗しました。設定を確認してください。")
      console.error("Error starting recording:", err)
      // エラー時は録音状態を解除
      setIsRecording(false)
      cleanupAudio()
    }
  }

  // 録音開始
  const startRecording = async () => {
    setIsRecording(true)
    await setupAudio(selectedDeviceId)
  }

  // 録音停止
  const stopRecording = () => {
    cleanupAudio()
    setIsRecording(false)
    setAudioLevel(0)
    // 情報は残す
  }

  // デバイス変更時の処理
  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    // デバイスが変更されたら、既存のオーディオ詳細情報は一度クリアする（再取得が必要なため）
    // ただし、録音中でない場合はラベル表示のために空の状態にするのではなく、
    // レンダリング時に selectedDeviceId からラベルを解決するようにする
    setAudioInfo(null)

    if (isRecording) {
      await setupAudio(deviceId)
    }
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
    <div className="w-full max-w-4xl mx-auto aspect-video flex flex-col relative bg-card/50 backdrop-blur-xl rounded-xl border border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/5">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full transition-colors duration-500", isRecording ? "bg-primary animate-pulse" : "bg-zinc-700")} />
            <h1 className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Signal Monitor</h1>
          </div>
          {error && <span className="text-xs text-red-400 mt-1 animate-in fade-in slide-in-from-top-1">{error}</span>}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">

        {/* Center Status / Level */}
        <div className="relative flex items-center justify-center mb-12 group">
          {/* Glowing Background Ring */}
          <div
            className={cn(
              "absolute w-64 h-64 rounded-full transition-all duration-500 ease-out blur-[60px] opacity-20 pointer-events-none",
              isRecording ? "bg-primary" : "bg-zinc-800"
            )}
            style={{ transform: `scale(${1 + audioLevel / 100})` }}
          />

          {/* Ripple Effect */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
          )}

          {/* Main Indicator */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer",
                isRecording
                  ? "border-primary/50 bg-primary/10 shadow-[0_0_40px_-10px_rgba(94,106,210,0.5)] scale-110"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105"
              )}
            >
              {isRecording ? (
                <div className="relative">
                  <Mic className={cn("h-6 w-6 text-primary transition-all duration-100", audioLevel > 50 && "scale-110 brightness-150")} />
                </div>
              ) : (
                <MicOff className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Frequency Bars */}
        <div className="flex items-end justify-center gap-1 h-12 w-full max-w-xs px-4">
          {[...Array(32)].map((_, i) => {
            // Simple simulation of frequency data visualization based on single level for now
            // In a real app, we'd use getByteFrequencyData per bin
            const heightMod = Math.sin(i * 0.4) * 0.5 + 0.5
            const height = isRecording
              ? Math.max(4, (audioLevel * heightMod * (0.6 + Math.random() * 0.4)))
              : 4

            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-150",
                  isRecording ? "bg-primary/80" : "bg-zinc-800"
                )}
                style={{
                  height: `${height}%`,
                  opacity: isRecording ? 0.4 + (height / 100) * 0.6 : 0.2
                }}
              />
            )
          })}
        </div>

        {/* Current Audio Info */}
        <div className={cn(
          "absolute bottom-8 left-0 right-0 flex justify-center transition-all duration-500",
          (audioInfo || selectedDeviceId) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className={cn(
            "flex items-center gap-4 px-4 py-2 rounded-full border text-[10px] font-mono shadow-lg transition-colors duration-300",
            isRecording
              ? "bg-black/40 backdrop-blur-md border-white/10 text-muted-foreground"
              : "bg-zinc-900/40 backdrop-blur-sm border-white/5 text-zinc-600"
          )}>
            <span className={cn(
              "font-medium truncate max-w-[200px] transition-colors duration-300",
              isRecording ? "text-foreground" : "text-zinc-500"
            )}>
              {audioInfo?.label || devices.find(d => d.deviceId === selectedDeviceId)?.label || "Select Microphone"}
            </span>

            <div className={cn("w-px h-3 transition-colors duration-300", isRecording ? "bg-white/10" : "bg-white/5")} />

            <div className="flex items-center gap-3">
              {audioInfo ? (
                <>
                  <span className={isRecording ? "" : "opacity-50"}>{audioInfo.sampleRate / 1000}kHz</span>
                  <span className={isRecording ? "" : "opacity-50"}>{audioInfo.channelCount}ch</span>
                </>
              ) : (
                <>
                  <span className="opacity-30">--kHz</span>
                  <span className="opacity-30">--ch</span>
                </>
              )}
              <span className={cn(
                "transition-colors duration-300",
                isRecording ? "text-emerald-400" : "text-zinc-600"
              )}>
                {isRecording ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={handleDeviceChange}
        echoEnabled={echoEnabled}
        onEchoChange={toggleEcho}
        delayTime={delayTime}
        onDelayChange={updateDelay}
        isRecording={isRecording}
      />
    </div>
  )
}
