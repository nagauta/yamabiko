import MicChecker from "@/components/mic-checker"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0C0E] relative overflow-hidden flex flex-col items-center justify-center">
      {/* 背景エフェクト */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-[#0B0C0E] to-[#0B0C0E] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container relative z-10 mx-auto px-4 py-8 md:py-16 max-w-5xl flex flex-col h-full">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white">
            Yamabiko
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <MicChecker />
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-zinc-700">
            made by <a href="https://github.com/nagauta" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 transition-colors underline decoration-zinc-800 hover:decoration-zinc-500">nagauta</a>
          </p>
        </div>
      </div>
    </main>
  )
}
