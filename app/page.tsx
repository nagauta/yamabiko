import MicChecker from "@/components/mic-checker"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center selection:bg-primary/20 selection:text-primary-foreground">
      {/* 背景エフェクト */}
      <div className="absolute inset-0 z-0 subtle-grid pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container relative z-10 mx-auto px-4 py-8 md:py-16 max-w-5xl flex flex-col h-full">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90">
            Yamabiko
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <MicChecker />
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            made by <a href="https://github.com/nagauta" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline decoration-border hover:decoration-foreground/50">nagauta</a>
          </p>
        </div>
      </div>
    </main>
  )
}
