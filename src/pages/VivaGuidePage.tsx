/**
 * FraudLens — FOAI Viva Defense Guide & Academic Companion
 * Foundations of Artificial Intelligence viva examination preparation, algorithm proofs,
 * and symbolic reasoning defense notes.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { BookOpen, CheckCircle, HelpCircle, Code, Layers, Shield, Cpu } from 'lucide-react';

export const VivaGuidePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViva = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/foai/viva-defense');
        setData(res);
      } catch (err) {
        console.error('Failed to load viva data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViva();
  }, []);

  if (isLoading || !data) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading viva defense material...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-2">
          Academic Companion & Viva Preparation
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Foundations of Artificial Intelligence: Viva Defense Dossier
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theoretical architecture, Forward Chaining mathematical formulation, graph ontology, and examiner Q&A
        </p>
      </div>

      {/* Core Classical AI Pillars */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-700" />
          <span>1. Core Symbolic AI Algorithms & Paradigms</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.coreAITechniques.map((tech: any, idx: number) => (
            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 shadow-xs">
              <h3 className="font-bold text-slate-900 text-xs">{tech.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{tech.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mathematical Formulation of Forward Chaining */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-700" />
          <span>2. Forward Chaining Mathematical Formulation</span>
        </h2>

        <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            Let <strong className="font-mono text-slate-900">WM_0</strong> denote the initial Working Memory populated by base facts extracted from the Knowledge Graph:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800">
            WM_0 = {'{'} f | f ∈ GraphEntities ∪ GraphEdges ∪ TransactionLog {'}'}
          </div>

          <p>
            At cycle <strong className="font-mono text-slate-900">t</strong>, the engine identifies the conflict set of satisfiable production rules whose premises are satisfied by <strong className="font-mono text-slate-900">WM_t</strong>:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800">
            ConflictSet_t = {'{'} (R_i, θ) | Premise(R_i)θ ⊆ WM_t {'}'}
          </div>

          <p>
            The newly inferred conclusions are added monotonically to Working Memory:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800">
            WM_{'{t+1}'} = WM_t ∪ {'{'} Conclusion(R_i)θ | (R_i, θ) ∈ ConflictSet_t {'}'}
          </div>

          <p>
            <strong className="text-slate-900">Fixed-Point Convergence Condition:</strong>
          </p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded font-mono text-[11px] text-blue-950 font-semibold">
            Execution terminates at cycle T where WM_T = WM_{'{T-1}'} (i.e., |WM_T \ WM_{'{T-1}'}| = 0).
          </div>
        </div>
      </div>

      {/* Viva Examiner Questions & Model Answers */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>3. Viva Voce Examination Questions & Defenses</span>
        </h2>

        <div className="space-y-3">
          {data.vivaQuestionsAndAnswers.map((qa: any, idx: number) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 space-y-2 shadow-xs">
              <div className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                  Q{idx + 1}
                </span>
                <h3 className="font-bold text-slate-900 text-xs">{qa.question}</h3>
              </div>
              <div className="pl-8 text-xs text-slate-600 leading-relaxed border-l-2 border-slate-200 ml-3">
                <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">Defense Strategy:</strong>
                {qa.answer}
              </div>
            </div>
          ))}

          {/* Additional viva question */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                Q4
              </span>
              <h3 className="font-bold text-slate-900 text-xs">
                How does this system differ from a black-box Deep Learning model like Graph Convolutional Networks (GCN)?
              </h3>
            </div>
            <div className="pl-8 text-xs text-slate-600 leading-relaxed border-l-2 border-slate-200 ml-3">
              <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">Defense Strategy:</strong>
              Under regulatory requirements such as FinCEN SAR filing and European GDPR Article 22, an adverse financial decision or account freezing requires a deterministic, legally defensible explanation trace. A GCN assigns latent embeddings with unexplainable weights, whereas FraudLens outputs the exact premises matched (e.g. shared device ID, transaction timestamp delta, circular loop leg) forming an audit-ready chain of custody.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
