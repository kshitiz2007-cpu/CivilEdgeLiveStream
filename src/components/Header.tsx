import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type WorkspaceTab = 'crux' | 'classroom' | 'prelims' | 'mains' | 'hub';

interface HeaderProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenPortal: () => void;
  userDisplayName: string;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'crux', label: 'Daily Crux' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'prelims', label: 'Prelims' },
  { id: 'mains', label: 'Mains Lab' },
  { id: 'hub', label: 'Study Hub' },
];

export function Header({ activeTab, onSelectTab, onOpenPortal, userDisplayName }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('crux')}
          className="font-serif text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-amber-700 transition-colors cursor-pointer"
        >
          CivilEdge <span className="text-amber-600 font-extrabold">IAS</span>
        </button>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive ? 'text-amber-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-600 rounded-full" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPortal}
            title={`Signed in as ${userDisplayName}`}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 whitespace-nowrap hover:bg-amber-400 shadow-xs transition-all cursor-pointer"
          >
            Aspirant Portal
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="md:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
