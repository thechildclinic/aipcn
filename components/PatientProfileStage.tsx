import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { Icons } from '../constants';

interface PatientProfileStageProps {
  initialProfile: PatientProfile | null;
  onProfileSaved: (profile: PatientProfile) => void;
  onBackToWelcome: () => void;
}

const PatientProfileStage: React.FC<PatientProfileStageProps> = ({ initialProfile, onProfileSaved, onBackToWelcome }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [pastHistory, setPastHistory] = useState('');
  const [habits, setHabits] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setAge(initialProfile.age || '');
      setPastHistory(initialProfile.pastHistory || '');
      setHabits(initialProfile.habits || '');
    }
  }, [initialProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        setError('Name is required to personalize your experience.');
        return;
    }
    if (!age.trim()) {
        setError('Age is required for more accurate suggestions.');
        return;
    }
     if (isNaN(parseInt(age)) || parseInt(age) <= 0 || parseInt(age) > 120) {
      setError('Please enter a valid age.');
      return;
    }
    setError('');
    onProfileSaved({ name, age, pastHistory, habits });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg mx-auto">
      <button onClick={onBackToWelcome} className="mb-4 text-sm text-blue-600 hover:text-blue-800">&larr; Back to Welcome</button>
      <h2 className="text-2xl font-semibold text-slate-700 mb-2 text-center">Your Health Profile</h2>
      <p className="text-sm text-slate-500 mb-6 text-center">
        Sharing a bit about yourself helps us personalize the experience and provide more relevant information. This is stored locally in your browser.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jane Doe"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="profile-age" className="block text-sm font-medium text-slate-700 mb-1">Age</label>
          <input
            type="number" // Changed to number for better validation, but still stored as string in type
            id="profile-age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g., 35"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="profile-history" className="block text-sm font-medium text-slate-700 mb-1">Past Medical History (Brief)</label>
          <textarea
            id="profile-history"
            value={pastHistory}
            onChange={(e) => setPastHistory(e.target.value)}
            placeholder="e.g., Mild asthma, no major surgeries. Penicillin allergy."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 custom-scrollbar"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="profile-habits" className="block text-sm font-medium text-slate-700 mb-1">Lifestyle Habits (Optional)</label>
          <textarea
            id="profile-habits"
            value={habits}
            onChange={(e) => setHabits(e.target.value)}
            placeholder="e.g., Non-smoker, drinks socially, exercises 3 times a week."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 custom-scrollbar"
            rows={3}
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow hover:shadow-md flex items-center justify-center"
        >
          <Icons.ChatBubble className="w-5 h-5 mr-2" /> {/* Using ChatBubble as placeholder, consider a profile icon */}
          Save Profile & Continue
        </button>
      </form>
    </div>
  );
};

export default PatientProfileStage;
