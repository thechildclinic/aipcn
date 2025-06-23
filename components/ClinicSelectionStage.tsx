
import React, { useState, useEffect, useMemo } from 'react';
import { Clinic, AppStage, ProvisionalDiagnosisResult } from '../types';
import { fetchClinics } from '../services/clinicService';
import LoadingSpinner from './LoadingSpinner';
import { Icons } from '../constants';

interface ClinicSelectionStageProps {
  provisionalDiagnosis: ProvisionalDiagnosisResult | null;
  onClinicSelected: (clinic: Clinic) => void;
  onBack: () => void;
}

const ClinicCard: React.FC<{ clinic: Clinic; onSelect: () => void }> = ({ clinic, onSelect }) => (
  <div className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-transparent hover:border-blue-500">
    <h3 className="text-xl font-semibold text-blue-700 mb-2">{clinic.name}</h3>
    <p className="text-sm text-slate-600 mb-1">{clinic.address}</p>
    <p className="text-sm text-slate-600 mb-1">Specialty: <span className="font-medium">{clinic.specialty}</span></p>
    <div className="flex justify-between text-sm text-slate-600 mt-3 mb-3">
      <span>Distance: {clinic.distance}</span>
      <span>Wait Time: {clinic.waitTime}</span>
      <span>Rating: {clinic.rating}/5 ✨</span>
    </div>
    <button
      onClick={onSelect}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
    >
      Select Clinic
    </button>
  </div>
);

const ClinicSelectionStage: React.FC<ClinicSelectionStageProps> = ({ provisionalDiagnosis, onClinicSelected, onBack }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'distance' | 'waitTime' | 'rating'>('distance');

  useEffect(() => {
    const loadClinics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedClinics = await fetchClinics(provisionalDiagnosis?.condition || null);
        setClinics(fetchedClinics);
      } catch (err) {
        setError("Could not load clinics. Please try again later.");
        console.error(err);
      }
      setIsLoading(false);
    };
    loadClinics();
  }, [provisionalDiagnosis]);

  const filteredAndSortedClinics = useMemo(() => {
    return clinics
      .filter(clinic => clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) || clinic.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
        if (sortBy === 'waitTime') return parseFloat(a.waitTime) - parseFloat(b.waitTime);
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [clinics, searchTerm, sortBy]);

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800 text-sm">&larr; Back to Symptoms</button>
      <h2 className="text-2xl font-semibold text-slate-700 mb-3 text-center">Find a Clinic</h2>
      {provisionalDiagnosis?.condition && (
        <p className="text-center text-slate-600 mb-1">
          Based on your symptoms, we think it might be related to: <strong className="text-blue-600">{provisionalDiagnosis.condition}</strong>.
        </p>
      )}
      <p className="text-center text-sm text-slate-600 mb-6">
          Please choose a clinic for consultation. This is a provisional assessment and a doctor's consultation is important.
      </p>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Icons.Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'distance' | 'waitTime' | 'rating')}
          className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="distance">Sort by Distance</option>
          <option value="waitTime">Sort by Wait Time</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {isLoading && <LoadingSpinner text="Finding suitable clinics..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {!isLoading && !error && filteredAndSortedClinics.length === 0 && (
        <p className="text-slate-600 text-center py-8">No clinics match your criteria or current provisional assessment. Try adjusting your search or check back later.</p>
      )}

      {!isLoading && !error && filteredAndSortedClinics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedClinics.map(clinic => (
            <ClinicCard key={clinic.id} clinic={clinic} onSelect={() => onClinicSelected(clinic)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicSelectionStage;
