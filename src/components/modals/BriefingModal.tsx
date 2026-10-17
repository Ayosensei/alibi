'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import { Clock, MapPin, Lightbulb, Play, X } from 'lucide-react';

export function BriefingModal() {
  const { caseData, isBriefingOpen, setBriefingOpen } = useGameStore();

  if (!isBriefingOpen || !caseData) return null;

  const windowTime = caseData.publicWindow
    .map((s) => caseData.slots[s - 1] ?? `Slot ${s}`)
    .join(' – ');

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setBriefingOpen(false); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-1 border border-border shadow-floating p-4 sm:p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200"
      >
        {/* Close icon */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBriefingOpen(false)}
            className="size-8 p-0 text-text-tertiary hover:text-text-primary"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="space-y-1.5 border-b border-border pb-4">
          <div className="font-mono text-xs uppercase tracking-widest text-brass">
            Case Briefing · File 0{caseData.level}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary">
            {caseData.title}
          </h2>
          <p className="text-xs text-text-secondary italic">
            "{caseData.tagline}"
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Chip
            variant="brass"
            icon={<MapPin className="size-3 text-brass" />}
          >
            Crime Scene: {caseData.crimeScene.replace(/_/g, ' ')}
          </Chip>
          <Chip
            variant="thread"
            icon={<Clock className="size-3 text-thread" />}
          >
            Murder Window: {windowTime}
          </Chip>
        </div>

        {/* Briefing Text */}
        <div className="p-4 rounded-lg bg-surface-2 border border-border/60 text-xs md:text-sm text-text-primary leading-relaxed whitespace-pre-line">
          {caseData.briefing}
        </div>

        {/* Initial Hints */}
        {caseData.hints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-text-secondary">
              <Lightbulb className="size-3.5 text-brass" />
              <span>Starting Clues & Objectives</span>
            </div>
            <ul className="space-y-1.5 text-xs text-text-secondary list-disc list-inside">
              {caseData.hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button & Shortcuts Reference */}
        <div className="pt-2 space-y-3">
          <Button
            variant="default"
            size="default"
            onClick={() => setBriefingOpen(false)}
            className="w-full justify-center"
          >
            <Play className="size-4 mr-2" />
            Begin Investigation
          </Button>

          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-tertiary">
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-secondary">?</kbd> Briefing</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-secondary">P</kbd> Present</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-secondary">B</kbd> Bait</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-secondary">A</kbd> Accuse</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-secondary">1-4</kbd> Tabs</span>
            <Link
              href="/tutorial"
              target="_blank"
              className="text-brass hover:underline flex items-center gap-1 font-sans"
              title="Open Detective Field Manual in new tab"
            >
              Field Manual ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
