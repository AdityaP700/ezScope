import TopicSearch from '@/components/TopicSearch'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium dark:bg-blue-900/30 dark:text-blue-400">
          AI-Powered Truth Analysis
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white pb-2">
          Analyze. Compare. <br />
          <span className="text-blue-600 dark:text-blue-500">Verify.</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Compare information from multiple sources, detect contradictions, and uncover the truth with our advanced semantic analysis engine.
        </p>

        <TopicSearch />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mt-12">
        <FeatureCard
          title="Multi-Source Analysis"
          description="Automatically fetch and compare content from Wikipedia, Grokipedia, and more."
          icon="🌐"
        />
        <FeatureCard
          title="Semantic Diff"
          description="Go beyond text matching. Our AI understands context to find real contradictions."
          icon="🧠"
        />
        <FeatureCard
          title="Community Verified"
          description="Stake tokens on findings to build a trusted web of knowledge."
          icon="🛡️"
        />
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900 dark:border-zinc-800">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
}
