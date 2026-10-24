import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Upload,
  FileText,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { parsePipeDelimitedQuizCsv, samplePipeDelimitedCsv } from '../lib/quizCsv.ts';
import type { DataRepo, NewQuizImportPayload, NewResourcePayload, NewTopicPayload } from '../lib/db/repo.ts';
import type {
  TopicOfDay,
  MainsQuestion,
  GSBadge,
  ResourceItem,
  UserRole,
  InfographicItem,
} from '../types/index.ts';
import { UploadResourceModal } from './UploadResourceModal';

export type AdminTab = 'quiz' | 'daily' | 'mains' | 'resources' | 'supabase';

export interface AdminStudioModalProps {
  open?: boolean;
  isOpen?: boolean;
  initialTab?: AdminTab;
  onClose: () => void;
  repo?: DataRepo;
  currentRole?: UserRole;
  resources?: ResourceItem[];
  onRefreshAll?: () => Promise<void> | void;
  onImportQuiz?: (payload: NewQuizImportPayload) => Promise<void>;
  onPublishTopic?: (topic: Partial<TopicOfDay>) => Promise<void>;
  onPublishMainsQuestion?: (mains: Partial<MainsQuestion>) => Promise<void>;
  onOpenBroadcastScheduler?: () => void;
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  open,
  isOpen,
  initialTab = 'quiz',
  onClose,
  repo,
  resources = [],
  onRefreshAll,
  onImportQuiz,
  onPublishTopic,
  onOpenBroadcastScheduler,
}) => {
  const visible = open ?? isOpen ?? false;
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [uploadResourceOpen, setUploadResourceOpen] = useState(false);

  // CSV Importer State
  const [csvText, setCsvText] = useState<string>(samplePipeDelimitedCsv);
  const [quizTitle, setQuizTitle] = useState('GS-2 Prelims Diagnostic Mini-Mock');
  const [quizPaper, setQuizPaper] = useState<GSBadge>('GS-2');
  const [quizSubject, setQuizSubject] = useState('Indian Polity & Governance');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Parse CSV
  const parseResult = parsePipeDelimitedQuizCsv(csvText, quizPaper, quizSubject);

  const handleImportSubmit = async () => {
    if (!parseResult.valid || parseResult.questions.length === 0 || isImporting) return;
    setIsImporting(true);
    setImportStatus(null);
    try {
      const payload: NewQuizImportPayload = {
        title: quizTitle,
        gsPaper: quizPaper,
        subject: quizSubject,
        testType: 'topic_quiz',
        durationMinutes,
        isPublished: true,
        questions: parseResult.questions,
      };

      if (onImportQuiz) {
        await onImportQuiz(payload);
      } else if (repo) {
        await repo.importQuiz(payload);
      }
      setImportStatus({
        success: true,
        message: `Successfully imported ${parseResult.questions.length} Prelims MCQs and created quiz "${quizTitle}"!`,
      });
      if (onRefreshAll) await onRefreshAll();
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Failed to import quiz.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Daily Topic State
  const [topicTitle, setTopicTitle] = useState('');
  const [topicCategory, setTopicCategory] = useState('Polity & Constitution');
  const [topicPaper, setTopicPaper] = useState<GSBadge>('GS-2');
  const [topicBullets, setTopicBullets] = useState('');
  const [isPublishingTopic, setIsPublishingTopic] = useState(false);
  const [topicPublished, setTopicPublished] = useState(false);

  // Daily Topic Infographic Attachment
  const dailyImageInputRef = useRef<HTMLInputElement>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState('');
  const [attachedImageCaption, setAttachedImageCaption] = useState('');

  const handleDailyImageFile = (file: File) => {
    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;
    setIsPublishingTopic(true);
    try {
      const infographicsList: InfographicItem[] = attachedImageUrl
        ? [
            {
              id: `info-${Date.now()}`,
              url: attachedImageUrl,
              title: topicTitle,
              caption: attachedImageCaption || undefined,
              source: 'CivilEdge Editorial Bureau',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [];

      const payload: Partial<TopicOfDay> = {
        title: topicTitle,
        category: topicCategory,
        gsPaper: topicPaper,
        source: 'The Hindu & PIB Analytical Bureau',
        publishDate: new Date().toISOString().split('T')[0],
        readTimeMinutes: 7,
        summaryBullets: topicBullets
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean),
        pdfBriefName: `${topicTitle.replace(/\s+/g, '_')}_Editorial_Brief.pdf`,
        infographics: infographicsList,
      };

      if (onPublishTopic) {
        await onPublishTopic(payload);
      } else if (repo) {
        await repo.publishTopicOfDay({
          title: topicTitle,
          category: topicCategory,
          source: 'The Hindu & PIB Analytical Bureau',
          publishDate: new Date().toISOString().split('T')[0],
          readTimeMinutes: 7,
          gsPaper: topicPaper,
          summaryBullets: topicBullets.split('\n').map((b) => b.trim()).filter(Boolean),
          keyArticlesOrData: [
            { label: 'Syllabus Anchor', value: `${topicPaper} · Core Editorial` },
            { label: 'Published Date', value: new Date().toISOString().split('T')[0] },
          ],
          mindmapNodes: [
            {
              title: 'Analytical Pillars',
              color: 'emerald',
              items: topicBullets.split('\n').map((b) => b.trim()).filter(Boolean).slice(0, 3),
            },
          ],
          infographics: infographicsList,
        });
      }
      setTopicPublished(true);
      setTopicTitle('');
      setTopicBullets('');
      setAttachedImageUrl(null);
      setAttachedImageName('');
      setAttachedImageCaption('');
      if (onRefreshAll) await onRefreshAll();
      setTimeout(() => setTopicPublished(false), 3000);
    } finally {
      setIsPublishingTopic(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150 font-sans">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/40 via-white to-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-slate-900">
                CivilEdge Faculty &amp; Admin Operations Suite
              </h2>
              <p className="text-xs text-slate-500">
                UPSC curriculum curation, pipe-delimited CSV test importer, editorial publisher &amp; database inspector.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/70 flex items-center gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Prelims CSV Test Importer</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'daily'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Publish Daily Crux</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Resources ({resources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Schema &amp; RLS Matrix</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* CSV Parameters Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GS Paper</label>
                  <select
                    value={quizPaper}
                    onChange={(e) => setQuizPaper(e.target.value as GSBadge)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  >
                    <option value="GS-1">GS-1</option>
                    <option value="GS-2">GS-2</option>
                    <option value="GS-3">GS-3</option>
                    <option value="CSAT">CSAT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Textarea for Pipe Delimited CSV */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    Pipe-Delimited Prelims MCQ Raw Input
                  </label>
                  <button
                    onClick={() => setCsvText(samplePipeDelimitedCsv)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                  >
                    Reset with Canonical UPSC Template
                  </button>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 bg-slate-50 font-mono text-xs text-slate-800 rounded-2xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white resize-y shadow-xs"
                  placeholder="Paste pipe-delimited CSV: Question | Statements | OptionA | OptionB | OptionC | OptionD | CorrectIdx | Explanation | Subject | Paper"
                />
              </div>

              {/* Validation Summary */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
                  parseResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-medium">
                  {parseResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {parseResult.valid
                      ? `Valid syntax: ${parseResult.questions.length} questions parsed ready for database insert.`
                      : `Validation errors (${parseResult.errors.length}): ${parseResult.errors[0]}`}
                  </span>
                </div>

                <button
                  onClick={handleImportSubmit}
                  disabled={!parseResult.valid || parseResult.questions.length === 0 || isImporting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
                >
                  {isImporting ? 'Publishing...' : 'Import & Publish Test'}
                </button>
              </div>

              {importStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold ${
                    importStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}
            </div>
          )}

          {activeTab === 'daily' && (
            <form onSubmit={handlePublishTopic} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Constitutional Morality & Doctrine of Separation of Powers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GS Paper</label>
                  <select
                    value={topicPaper}
                    onChange={(e) => setTopicPaper(e.target.value as GSBadge)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  >
                    <option value="GS-1">GS-1</option>
                    <option value="GS-2">GS-2</option>
                    <option value="GS-3">GS-3</option>
                    <option value="GS-4">GS-4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thematic Category</label>
                  <input
                    type="text"
                    value={topicCategory}
                    onChange={(e) => setTopicCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Analytical Takeaways (One bullet per line)
                </label>
                <textarea
                  rows={4}
                  value={topicBullets}
                  onChange={(e) => setTopicBullets(e.target.value)}
                  placeholder="Point 1: Context and legal precedent...&#10;Point 2: Judicial rulings & statutory citations...&#10;Point 3: Administrative challenges and Way Forward..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                />
              </div>

              {/* Infographic Attachment */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    Attach Visual Infographic / Flowchart / Map (JPG / PNG)
                  </label>
                  {attachedImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImageUrl(null);
                        setAttachedImageName('');
                        setAttachedImageCaption('');
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={dailyImageInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDailyImageFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {attachedImageUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={attachedImageUrl}
                        alt="Attached infographic"
                        className="w-16 h-16 object-cover rounded-lg border border-stone-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-stone-200 truncate">{attachedImageName}</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">Attached to Daily Crux Carousel</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={attachedImageCaption}
                      onChange={(e) => setAttachedImageCaption(e.target.value)}
                      placeholder="Infographic caption or takeaway (e.g. Figure 1: Horizontal Devolution Formula)..."
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => dailyImageInputRef.current?.click()}
                    className="w-full border border-dashed border-stone-700 hover:border-amber-500/80 rounded-lg p-3 text-center text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                  >
                    + Browse Image / Diagram File (.jpg, .png, .svg)
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {topicPublished && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Published to Today's Crux Feed with Carousel!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isPublishingTopic}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isPublishingTopic ? 'Publishing...' : 'Publish Daily Topic'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div>
                  <h3 className="text-sm font-bold text-stone-200">
                    Resource Library Inventory ({resources.length} items)
                  </h3>
                  <p className="text-xs text-stone-400">
                    NCERTs, standard references, handouts &amp; visual infographics
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadResourceOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Upload Resource (PDF / JPG)
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {resources.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{r.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          r.format === 'jpg' || r.format === 'png' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.format.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {r.authorOrSource} • {r.category} • {r.gsPaper}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400 font-mono text-[11px]">{r.downloads} reads</span>
                      {repo && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete "${r.title}"?`)) {
                              await repo.deleteResource(r.id);
                              if (onRefreshAll) await onRefreshAll();
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-slate-50 border border-amber-200/80 shadow-xs text-slate-900">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                  <Database className="w-4 h-4 text-amber-700" />
                  <span>CivilEdge Supabase PostgreSQL Architecture (Option A)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  PostgreSQL 15+ relational schema with 10 tables, Row Level Security (RLS) policies,
                  role-based access control (RBAC), and Supabase Storage bucket configurations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {[
                  { table: 'profiles', rls: 'Public Read / Self Update', rows: 'Aspirant profiles & study clock' },
                  { table: 'broadcast_classes', rls: 'Public Read / Faculty Write', rows: 'Studio live seminars & timetable' },
                  { table: 'lecture_doubts', rls: 'Public Read / Authenticated Insert', rows: 'Realtime lecture Q&A' },
                  { table: 'lecture_notes', rls: 'Private / User Only', rows: 'Timestamped study notes' },
                  { table: 'quiz_questions', rls: 'Public Read / Admin Write', rows: 'Bilingual Prelims MCQs' },
                  { table: 'quizzes', rls: 'Public Read / Admin Write', rows: 'Full mock tests & drills' },
                  { table: 'test_attempts', rls: 'Private / User Only', rows: 'Scorecards & negative marking logs' },
                  { table: 'mains_questions', rls: 'Public Read / Admin Write', rows: 'Mains 10/15 marker questions' },
                  { table: 'mains_submissions', rls: 'Private / User + Evaluator', rows: 'Written answers & AI feedback' },
                  { table: 'resources', rls: 'Public Read / Admin Write', rows: 'NCERT, standard compendiums & PDFs' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>public.{item.table}</span>
                      <span className="text-[10px] text-emerald-800 font-sans font-semibold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                        RLS ENABLED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.rows}</div>
                    <div className="text-[10px] text-amber-700 font-semibold mt-1">Policy: {item.rls}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Resource Modal */}
      <UploadResourceModal
        open={uploadResourceOpen}
        onClose={() => setUploadResourceOpen(false)}
        onUpload={async (payload) => {
          if (repo) {
            await repo.uploadResource('00000000-0000-4000-8000-000000000001', true, payload);
          }
          if (onRefreshAll) await onRefreshAll();
        }}
      />
    </div>
  );
};
