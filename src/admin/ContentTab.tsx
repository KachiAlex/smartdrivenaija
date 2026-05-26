import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { api, type Module, type Question, type Pagination } from './api';
import * as XLSX from 'xlsx';

// ── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ d }: { d: number }) {
  const cls = d === 1 ? 'bg-green-100 text-green-700' : d === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  const label = d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Hard';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

// ── Question form modal ───────────────────────────────────────────────────────
function QuestionModal({
  token, modules, initial, onClose, onSaved,
}: {
  token: string;
  modules: Module[];
  initial: Partial<Question> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    module_id: initial?.module_id ?? (modules[0]?.id ?? 0),
    topic_tag: initial?.topic_tag ?? '',
    question_en: initial?.question_en ?? '',
    options: initial?.options_en ?? ['', '', '', ''],
    correct_answer: initial?.correct_answer ?? 0,
    explanation_en: initial?.explanation_en ?? '',
    difficulty: initial?.difficulty ?? 1,
    is_mock_test_eligible: initial?.is_mock_test_eligible !== false,
    question_type: initial?.question_type ?? 'multiple_choice',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = form.options.filter(o => o.trim());
    if (filled.length < 2) { setError('At least 2 options required'); return; }
    if (!form.topic_tag.trim()) { setError('Topic tag required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        module_id: form.module_id,
        topic_tag: form.topic_tag.trim(),
        question_en: form.question_en.trim(),
        options_en: form.options.filter(o => o.trim()),
        correct_answer: form.correct_answer,
        explanation_en: form.explanation_en.trim() || null,
        difficulty: form.difficulty,
        is_mock_test_eligible: form.is_mock_test_eligible,
        question_type: form.question_type,
      };
      if (isEdit) await api.updateQuestion(token, initial!.id!, payload);
      else await api.createQuestion(token, payload);
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Edit Question' : 'New Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Module */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Module</label>
            <select value={form.module_id} onChange={e => set('module_id', parseInt(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none">
              {modules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.title_en}</option>)}
            </select>
          </div>

          {/* Topic + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Topic Tag</label>
              <input value={form.topic_tag} onChange={e => set('topic_tag', e.target.value)} placeholder="e.g. road_signs" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
              <select value={form.question_type} onChange={e => set('question_type', e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="scenario">Scenario</option>
              </select>
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</label>
            <textarea value={form.question_en} onChange={e => set('question_en', e.target.value)} rows={3} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none resize-none" required />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Options <span className="text-gray-400 font-normal normal-case">(mark correct with ●)</span></label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => set('correct_answer', i)}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-xs transition-colors
                      ${form.correct_answer === i ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}
                  >
                    {form.correct_answer === i ? '●' : i + 1}
                  </button>
                  <input
                    value={opt}
                    onChange={e => { const o = [...form.options]; o[i] = e.target.value; set('options', o); }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none"
                  />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => { const o = form.options.filter((_, j) => j !== i); set('options', o); if (form.correct_answer >= o.length) set('correct_answer', 0); }} className="text-gray-300 hover:text-red-400 text-lg">✕</button>
                  )}
                </div>
              ))}
              {form.options.length < 6 && (
                <button type="button" onClick={() => set('options', [...form.options, ''])} className="text-xs text-[#E63946] font-semibold hover:underline">+ Add option</button>
              )}
            </div>
          </div>

          {/* Difficulty + Mock eligible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', parseInt(e.target.value))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none">
                <option value={1}>1 — Easy</option>
                <option value={2}>2 — Medium</option>
                <option value={3}>3 — Hard</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input type="checkbox" checked={form.is_mock_test_eligible} onChange={e => set('is_mock_test_eligible', e.target.checked)} className="w-4 h-4 accent-[#E63946]" />
                <span className="text-sm text-gray-700 font-medium">Mock test eligible</span>
              </label>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Explanation <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
            <textarea value={form.explanation_en} onChange={e => set('explanation_en', e.target.value)} rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none resize-none" />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-10 bg-[#1D3557] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#0A1628]">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Module form modal ─────────────────────────────────────────────────────────
function ModuleModal({ token, initial, onClose, onSaved }: { token: string; initial: Partial<Module> | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    slug: initial?.slug ?? '',
    title_en: initial?.title_en ?? '',
    description_en: initial?.description_en ?? '',
    icon: initial?.icon ?? '📚',
    sort_order: initial?.sort_order ?? 0,
    is_free: initial?.is_free ?? false,
    estimated_minutes: initial?.estimated_minutes ?? 60,
    xp_reward: initial?.xp_reward ?? 500,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (isEdit) await api.updateModule(token, initial!.id!, form);
      else await api.createModule(token, form);
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Edit Module' : 'New Module'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title</label>
              <input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Icon</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-center text-2xl bg-white focus:border-[#E63946] outline-none" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="road-signs" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea value={form.description_en ?? ''} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Est. Minutes</label>
              <input type="number" value={form.estimated_minutes} onChange={e => setForm(f => ({ ...f, estimated_minutes: parseInt(e.target.value) }))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">XP Reward</label>
              <input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: parseInt(e.target.value) }))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-[#E63946] outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} className="w-4 h-4 accent-[#E63946]" />
            <span className="text-sm text-gray-700 font-medium">Free module (accessible without premium)</span>
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-10 bg-[#1D3557] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bulk import modal (Excel + JSON) ──────────────────────────────────────────
function BulkImportModal({ token, modules, onClose, onImported }: { token: string; modules: Module[]; onClose: () => void; onImported: () => void }) {
  const [json, setJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [importMode, setImportMode] = useState<'json' | 'excel'>('excel');

  const handleImport = async () => {
    setError(''); setResult('');
    let parsed: any[];
    try { parsed = JSON.parse(json); } catch { setError('Invalid JSON'); return; }
    if (!Array.isArray(parsed)) { setError('Must be a JSON array'); return; }
    setSaving(true);
    try {
      const r = await api.bulkImportQuestions(token, parsed);
      setResult(r.message);
      onImported();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSaving(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        setError('Excel file is empty or has invalid format');
        setSaving(false);
        return;
      }
      const questions = jsonData.map((row: any, index: number) => {
        let options: string[] = [];
        if (row.options) {
          options = String(row.options).split(',').map((o: string) => o.trim()).filter(Boolean);
        } else if (row.option_a) {
          options = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
        }
        if (options.length < 2) {
          throw new Error(`Row ${index + 2}: At least 2 options required`);
        }
        const correctAnswer = parseInt(String(row.correct_answer), 10);
        if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
          throw new Error(`Row ${index + 2}: correct_answer must be 0-${options.length - 1}`);
        }
        return {
          module_id: row.module_id ? parseInt(String(row.module_id), 10) : (modules[0]?.id ?? 1),
          topic_tag: String(row.topic_tag || 'general'),
          question_en: String(row.question || row.question_en || ''),
          options_en: options,
          correct_answer: correctAnswer,
          explanation_en: String(row.explanation || row.explanation_en || ''),
          difficulty: parseInt(String(row.difficulty), 10) || 1,
          is_mock_test_eligible: row.is_mock_test_eligible === true || row.is_mock_test_eligible === 'true' || row.is_mock_test_eligible === 1,
          question_type: String(row.question_type || 'multiple_choice'),
        };
      });
      const r = await api.bulkImportQuestions(token, questions);
      setResult(`${r.message} (${questions.length} questions)`);
      onImported();
    } catch (e: any) {
      setError(e.message || 'Failed to parse Excel file');
    } finally {
      setSaving(false);
    }
  };

  const downloadSampleExcel = () => {
    const sampleData = [{
      module_id: modules[0]?.id ?? 1,
      topic_tag: 'road_signs',
      question: 'What does a red octagonal sign mean?',
      options: 'Stop,Slow down,Give way,No entry',
      correct_answer: 0,
      explanation: 'A red octagonal sign always means STOP.',
      difficulty: 1,
      is_mock_test_eligible: 1,
      question_type: 'multiple_choice',
    }, {
      module_id: modules[0]?.id ?? 1,
      topic_tag: 'speed_limits',
      question: 'What is the speed limit in a residential area?',
      options: '30 km/h,50 km/h,60 km/h,80 km/h',
      correct_answer: 1,
      explanation: 'Standard speed limit in residential areas is 50 km/h.',
      difficulty: 2,
      is_mock_test_eligible: 1,
      question_type: 'multiple_choice',
    }];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    worksheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 50 }, { wch: 40 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 20 }, { wch: 15 }];
    XLSX.writeFile(workbook, 'questions_template.xlsx');
  };

  const example = JSON.stringify([{
    module_id: modules[0]?.id ?? 1,
    topic_tag: 'road_signs',
    question_en: 'What does a red octagonal sign mean?',
    options_en: ['Stop', 'Slow down', 'Give way', 'No entry'],
    correct_answer: 0,
    explanation_en: 'A red octagonal sign always means STOP.',
    difficulty: 1,
    is_mock_test_eligible: true,
  }], null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-gray-800">Bulk Import Questions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setImportMode('excel')} className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${importMode === 'excel' ? 'bg-white text-[#E63946] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Excel Upload</button>
            <button onClick={() => setImportMode('json')} className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors ${importMode === 'json' ? 'bg-white text-[#E63946] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>JSON Paste</button>
          </div>

          {importMode === 'excel' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <h3 className="font-semibold text-blue-800">Excel Import Format</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Required columns: <code className="bg-blue-100 px-1 py-0.5 rounded">question</code>,
                  <code className="bg-blue-100 px-1 py-0.5 rounded">options</code> (comma-separated),
                  <code className="bg-blue-100 px-1 py-0.5 rounded">correct_answer</code> (0-based index).
                  Optional: <code className="bg-blue-100 px-1 py-0.5 rounded">module_id</code>,
                  <code className="bg-blue-100 px-1 py-0.5 rounded">topic_tag</code>,
                  <code className="bg-blue-100 px-1 py-0.5 rounded">explanation</code>,
                  <code className="bg-blue-100 px-1 py-0.5 rounded">difficulty</code> (1-3),
                  <code className="bg-blue-100 px-1 py-0.5 rounded">is_mock_test_eligible</code> (0/1).
                </p>
                <button onClick={downloadSampleExcel} className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Sample Template
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#E63946] transition-colors">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} disabled={saving} className="hidden" id="excel-upload" />
                <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span className="text-sm font-medium text-gray-600">Click to upload Excel file</span>
                  <span className="text-xs text-gray-400">.xlsx, .xls, or .csv</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Paste a JSON array of question objects. Example:</p>
              <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 overflow-x-auto border border-gray-200">{example}</pre>
              <textarea value={json} onChange={e => setJson(e.target.value)} rows={10} placeholder="Paste JSON array here…" className="w-full border-2 border-gray-200 rounded-xl p-3 text-xs font-mono focus:border-[#E63946] outline-none resize-y" />
            </div>
          )}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          {result && <p className="text-xs text-green-600 font-semibold">{result}</p>}
        </div>
        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          {importMode === 'json' && (
            <button onClick={handleImport} disabled={saving || !json.trim()} className="flex-1 h-10 bg-[#E63946] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Importing…' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ContentTab ───────────────────────────────────────────────────────────
export function ContentTab({ token, toast }: { token: string; toast: { ok: (m: string) => void; err: (m: string) => void } }) {
  const [view, setView] = useState<'modules' | 'questions'>('modules');
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  const [moduleFilter, setModuleFilter] = useState<number | ''>('');
  const [mockFilter, setMockFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [moduleModal, setModuleModal] = useState<{ open: boolean; initial: Partial<Module> | null }>({ open: false, initial: null });
  const [questionModal, setQuestionModal] = useState<{ open: boolean; initial: Partial<Question> | null }>({ open: false, initial: null });
  const [bulkModal, setBulkModal] = useState(false);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try { setModules(await api.getModules(token)); }
    catch (e: any) { toast.err(e.message); }
    finally { setLoading(false); }
  }, [token]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getQuestions(token, {
        module_id: moduleFilter || undefined,
        page, search: search || undefined,
        mock_only: mockFilter || undefined,
      });
      setQuestions(r.questions); setPagination(r.pagination);
    } catch (e: any) { toast.err(e.message); }
    finally { setLoading(false); }
  }, [token, moduleFilter, page, search, mockFilter]);

  useEffect(() => { fetchModules(); }, [fetchModules]);
  useEffect(() => { if (view === 'questions') fetchQuestions(); }, [view, fetchQuestions]);

  const deleteQuestion = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    try { await api.deleteQuestion(token, id); toast.ok('Deleted'); fetchQuestions(); }
    catch (e: any) { toast.err(e.message); }
  };

  const deleteModule = async (id: number) => {
    if (!confirm('Delete this module and ALL its questions/lessons?')) return;
    try { await api.deleteModule(token, id); toast.ok('Module deleted'); fetchModules(); }
    catch (e: any) { toast.err(e.message); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-5 max-w-6xl"
    >
      {/* Modals */}
      {moduleModal.open && (
        <ModuleModal token={token} initial={moduleModal.initial} onClose={() => setModuleModal({ open: false, initial: null })}
          onSaved={() => { setModuleModal({ open: false, initial: null }); toast.ok('Module saved'); fetchModules(); }} />
      )}
      {questionModal.open && (
        <QuestionModal token={token} modules={modules} initial={questionModal.initial}
          onClose={() => setQuestionModal({ open: false, initial: null })}
          onSaved={() => { setQuestionModal({ open: false, initial: null }); toast.ok('Question saved'); fetchQuestions(); }} />
      )}
      {bulkModal && (
        <BulkImportModal token={token} modules={modules} onClose={() => setBulkModal(false)}
          onImported={() => { setBulkModal(false); toast.ok('Questions imported'); fetchQuestions(); }} />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-[#0F172A]">Content Management</h1>
        <div className="flex gap-2">
          {view === 'modules' && (
            <button onClick={() => setModuleModal({ open: true, initial: null })} className="h-9 px-4 bg-[#1D3557] text-white text-sm rounded-xl font-semibold hover:bg-[#0A1628]">
              + New Module
            </button>
          )}
          {view === 'questions' && (
            <>
              <button onClick={() => setBulkModal(true)} className="h-9 px-4 border-2 border-gray-200 text-gray-600 text-sm rounded-xl font-semibold hover:bg-gray-50">
                ⬆ Bulk Import
              </button>
              <button onClick={() => setQuestionModal({ open: true, initial: null })} className="h-9 px-4 bg-[#1D3557] text-white text-sm rounded-xl font-semibold hover:bg-[#0A1628]">
                + New Question
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['modules', 'questions'] as const).map(v => (
          <button key={v} onClick={() => { setView(v); setPage(1); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize
              ${view === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {v === 'modules' ? `📚 Modules (${modules.length})` : '❓ Questions'}
          </button>
        ))}
      </div>

      {/* ── Modules view ── */}
      {view === 'modules' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {loading ? [...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />) :
            modules.length === 0 ? <p className="text-gray-400 text-sm col-span-3">No modules yet. Create one above.</p> :
            modules.map(m => (
              <motion.div
                key={m.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-[#E63946]/10 glass-card shadow-sm p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{m.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{m.title_en}</p>
                      <p className="text-xs text-gray-400">{m.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModuleModal({ open: true, initial: m })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 text-xs">✏️</button>
                    <button onClick={() => deleteModule(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 text-xs">🗑</button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>❓ {m.question_count ?? 0} questions</span>
                  <span>📖 {m.lesson_count ?? 0} lessons</span>
                  <span>⏱ {m.estimated_minutes}m</span>
                </div>
                <div className="flex gap-2">
                  {m.is_free && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Free</span>}
                  {m.is_premium && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Premium</span>}
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">⭐ {m.xp_reward} XP</span>
                </div>
                <button
                  onClick={() => { setModuleFilter(m.id); setView('questions'); setPage(1); }}
                  className="w-full text-xs text-[#E63946] font-semibold hover:underline text-left"
                >
                  View questions →
                </button>
              </motion.div>
            ))
          }
        </motion.div>
      )}

      {/* ── Questions view ── */}
      {view === 'questions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <input type="search" placeholder="Search questions…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={e => e.key === 'Enter' && fetchQuestions()}
              className="flex-1 min-w-48 h-10 px-4 border-2 border-gray-200 rounded-xl text-sm bg-white focus:border-[#E63946] outline-none" />
            <select value={moduleFilter} onChange={e => { setModuleFilter(e.target.value ? parseInt(e.target.value) : ''); setPage(1); }}
              className="h-10 px-3 border-2 border-gray-200 rounded-xl text-sm bg-white focus:border-[#E63946] outline-none">
              <option value="">All modules</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.title_en}</option>)}
            </select>
            <label className="flex items-center gap-2 h-10 px-3 border-2 border-gray-200 rounded-xl text-sm bg-white cursor-pointer">
              <input type="checkbox" checked={mockFilter} onChange={e => { setMockFilter(e.target.checked); setPage(1); }} className="accent-[#E63946]" />
              Mock only
            </label>
            <button onClick={fetchQuestions} className="h-10 px-4 bg-[#1D3557] text-white text-sm rounded-xl hover:bg-[#0A1628] font-semibold">Search</button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E63946]/10 glass-card shadow-sm overflow-hidden">
            {loading ? <div className="p-12 text-center text-gray-400 text-sm">Loading…</div> :
              questions.length === 0 ? <div className="p-12 text-center text-gray-400 text-sm">No questions found. Create one or import via JSON.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Question</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Module</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Diff</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Mock</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map(q => (
                        <tr key={q.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="text-gray-800 text-xs font-medium truncate">{q.question_en}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{q.topic_tag} · {q.options_en?.length ?? 0} options</p>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{q.module_title || '—'}</td>
                          <td className="px-4 py-3.5"><DiffBadge d={q.difficulty} /></td>
                          <td className="px-4 py-3.5 text-xs">
                            {q.is_mock_test_eligible
                              ? <span className="text-green-500 font-semibold">✓</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => setQuestionModal({ open: true, initial: q })} className="text-xs text-[#1D3557] font-semibold hover:underline">Edit</button>
                              <button onClick={() => deleteQuestion(q.id)} className="text-xs text-red-400 font-semibold hover:underline">Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            {pagination && pagination.pages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.pages} · {pagination.total} questions</span>
                <div className="flex gap-2">
                  <button disabled={pagination.page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  <button disabled={pagination.page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
