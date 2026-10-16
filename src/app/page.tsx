import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-text-primary">
      <div className="flex max-w-xl flex-col items-center text-center gap-6">
        <div className="font-mono text-xs tracking-widest text-brass uppercase">
          Case File — Season 1
        </div>

        <h1 className="font-serif text-5xl font-semibold tracking-tight text-text-primary">
          Every lie <span className="italic font-normal text-thread">leaves</span> a path.
        </h1>

        <p className="text-base text-text-secondary leading-relaxed max-w-md">
          A detective game where suspect statements become a graph in FalkorDB.
          Contradictions, rehearsed alibis, and impossible journeys expose the truth.
        </p>

        <div className="flex items-center gap-4 mt-4">
          <Link href="/season/1">
            <Button variant="default" size="default">
              Begin Investigation
            </Button>
          </Link>
          <Link href="/season/1">
            <Button variant="secondary" size="default">
              Case Files
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
