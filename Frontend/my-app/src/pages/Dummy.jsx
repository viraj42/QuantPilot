function Dummy() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500">
      <div className="glass-card glass-card-hover p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-heading mb-4 text-primary">
          FasalMitra Elite UI
        </h1>
        <p className="text-foreground/70 mb-6">
          If you see this styled card and font, our Senior Frontend System is active.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary">Get Started</button>
          <button className="btn-secondary">View Courses</button>
        </div>
      </div>
      
      {/* Theme Toggle Helper */}
      <button 
        onClick={() => document.documentElement.classList.toggle('dark')}
        className="mt-10 text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
      >
        Toggle Dark Mode
      </button>
    </div>
  )
}

export default Dummy