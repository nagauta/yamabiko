import { Mic, Github, AudioWaveform } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  return (
    <div className="w-[240px] h-full flex flex-col border-r border-white/5 bg-[#0B0C0E] shrink-0">
      <div className="h-12 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-white/90">
          <div className="w-5 h-5 bg-white/10 rounded-sm flex items-center justify-center">
             <AudioWaveform className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium text-sm tracking-tight">Yamabiko</span>
        </div>
      </div>
      
      <div className="flex-1 py-3 px-2 space-y-0.5">
        <div className="px-2 py-1.5 mb-2">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Tools</span>
        </div>
        <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-white/5 h-8 px-2.5 font-normal">
          <Mic className="mr-2 h-4 w-4 opacity-70" />
          <span className="text-xs">Signal Monitor</span>
        </Button>
      </div>

      <div className="p-2 border-t border-white/5">
        <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-300 hover:bg-white/5 h-8 px-2.5 font-normal" asChild>
          <a href="https://github.com/nagauta" target="_blank" rel="noopener noreferrer">
            <Github className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-xs">nagauta</span>
          </a>
        </Button>
      </div>
    </div>
  )
}

