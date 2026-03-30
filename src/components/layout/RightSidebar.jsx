import React from 'react';
import { TrendingUp, Hash } from 'lucide-react';

const trends = [
  { category: 'Programming', topic: 'React 19 Hooks', count: '1,204', hot: true },
  { category: 'Literature', topic: 'হুমায়ূন আহমেদ', count: '856', hot: true, bengali: true },
  { category: 'Design', topic: 'Minimalism in UI', count: '432' },
  { category: 'Tech', topic: 'AI & বাংলাদেশ', count: '318', bengali: true },
  { category: 'Music', topic: 'Rabindra Sangeet', count: '271' },
];

const RightSidebar = () => {
  return (
    <div className="hidden lg:flex flex-col w-80 h-screen sticky top-0 border-l border-white/[0.05] px-5 py-7 bg-lekho-surface/30 gap-6">
      {/* Trending Card */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-lekho-primary-light" />
          <h3 className="font-bold text-lekho-text text-[15px] font-bengali">Trending on লেখো</h3>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {trends.map((trend, i) => (
            <button
              key={i}
              className="w-full text-left px-5 py-4 hover:bg-lekho-primary/5 transition-colors group"
            >
              <p className="text-[11px] text-lekho-muted font-semibold uppercase tracking-wider mb-1">
                {trend.category} · Trending
              </p>
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-lekho-muted shrink-0" />
                <p className={`font-bold text-lekho-text group-hover:text-lekho-primary-light transition-colors text-[15px] truncate ${trend.bengali ? 'font-bengali' : ''}`}>
                  {trend.topic}
                </p>
                {trend.hot && (
                  <span className="ml-auto shrink-0 text-[9px] font-bold text-lekho-accent border border-lekho-accent/30 rounded-full px-1.5 py-0.5 bg-lekho-accent/10">
                    HOT
                  </span>
                )}
              </div>
              <p className="text-xs text-lekho-muted mt-0.5">{trend.count} posts</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-lekho-muted leading-relaxed px-1">
        © 2026 লেখো · Words that Connect<br />
        Built for a noise-free experience.
      </p>
    </div>
  );
};

export default RightSidebar;
