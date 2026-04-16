export default function PracticeIndexPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-2xl w-full rounded-3xl bg-white p-10 shadow-xl text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Practice Page</h1>
        <p className="text-slate-600 mb-8">Choose a practice sheet from the levels page or start a challenge.</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a href="/levels" className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700">Go to Levels</a>
          <a href="/challenge" className="inline-block rounded-xl bg-slate-200 px-6 py-3 text-slate-900 hover:bg-slate-300">Go to Challenges</a>
        </div>
      </div>
    </main>
  )
}
