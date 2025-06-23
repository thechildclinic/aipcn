import React from 'react';
import { Episode } from '../types';
import { Icons } from '../constants';

interface InteractionHistoryViewProps {
  episodes: Episode[];
  onBack: () => void;
  onClearHistory: () => void;
}

const InteractionHistoryView: React.FC<InteractionHistoryViewProps> = ({ episodes, onBack, onClearHistory }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-700">Interaction History</h2>
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-800">&larr; Back to Welcome</button>
      </div>

      {episodes.length === 0 ? (
        <p className="text-slate-600 text-center py-8">No past interactions found.</p>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {episodes.map((episode) => (
            <div key={episode.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-800">{episode.patientName ? `${episode.patientName}'s Interaction` : 'Past Interaction'} - <span className="text-sm text-slate-600 font-normal">{episode.date}</span></h3>
              <p className="text-sm text-slate-600 mt-1"><strong>Symptoms Noted:</strong> {episode.initialSymptomsSummary}</p>
              <p className="text-sm text-slate-600"><strong>AI Assessment:</strong> {episode.provisionalDiagnosisSummary}</p>
              {episode.clinicName && <p className="text-sm text-slate-600"><strong>Clinic:</strong> {episode.clinicName}</p>}
              {episode.prescriptionSummary && <p className="text-sm text-slate-600"><strong>Prescription Notes:</strong> {episode.prescriptionSummary}</p>}
            </div>
          ))}
        </div>
      )}

      {episodes.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all interaction history? This cannot be undone.")) {
                onClearHistory();
              }
            }}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractionHistoryView;
