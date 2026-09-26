import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Skeleton } from '../../../components/common/LayoutComponents';
import {
  BookOpen,
  HelpCircle,
  ShieldCheck,
  BotMessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export const KnowledgeBasePage = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTopicId, setOpenTopicId] = useState(null);

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const fetchKnowledgeBase = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/knowledge-base');
      setTopics(res.data || []);
      if (res.data && res.data.length > 0) {
        setOpenTopicId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (id) => {
    setOpenTopicId(openTopicId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AML & Financial Risk Knowledge Base
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Educational RAG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Understanding algorithmic transaction monitoring, structuring criteria, and regulatory definitions.
          </p>
        </div>

        <Link to="/ai-assistant">
          <Button variant="outline" size="sm" icon={BotMessageSquare}>
            Ask MoneyTrace Agent
          </Button>
        </Link>
      </div>

      {/* Critical Legal Distinction Callout */}
      <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-2xl flex items-start gap-3 text-xs text-brand-950 leading-relaxed shadow-sm">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm mb-1 text-brand-900">
            Crucial Regulatory & Compliance Distinction
          </h4>
          <p>
            MoneyTrace AI is an analytical risk-identification tool. Automated algorithms evaluate mathematical anomalies, velocity, and statistical deviations. The application uses terms such as <strong>Normal, Low Risk, Medium Risk, High Risk, and Needs Review</strong>. An indicator is purely an alert for human review and does NOT establish that funds are legally "black money" or illegal proceeds.
          </p>
        </div>
      </div>

      {/* Accordion Topics */}
      <div className="space-y-3">
        {loading ? (
          <Skeleton className="h-24" count={4} />
        ) : (
          topics.map((topic) => {
            const isOpen = openTopicId === topic.id;
            return (
              <div
                key={topic.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      <HelpCircle className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{topic.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-xs md:text-sm text-slate-700 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    <p className="whitespace-pre-line">{topic.details}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
