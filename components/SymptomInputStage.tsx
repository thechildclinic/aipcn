
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ProvisionalDiagnosisResult, GeneratedQuestion, PatientProfile, MetaSymptomQuestion } from '../types';
import { getInitialAssessmentAndQuestion, getProvisionalDiagnosis } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { Icons } from '../constants';

interface SymptomInputStageProps {
  patientProfile: PatientProfile | null;
  onNextStage: (provisionalDiagnosis: ProvisionalDiagnosisResult, initialSymptoms: string, chatHistory: ChatMessage[]) => void;
  initialSymptoms?: string;
  existingChatHistory?: ChatMessage[];
}

const SymptomInputStage: React.FC<SymptomInputStageProps> = ({ patientProfile, onNextStage, initialSymptoms = '', existingChatHistory = [] }) => {
  const [symptomsText, setSymptomsText] = useState<string>(initialSymptoms);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(existingChatHistory);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentMetaSymptomQuestions, setCurrentMetaSymptomQuestions] = useState<MetaSymptomQuestion[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory, currentMetaSymptomQuestions]);
  
  const addMessageToChat = (sender: 'user' | 'ai' | 'system', text: string, isMetaSuggestion: boolean = false) => {
    const newMessage: ChatMessage = { 
      id: Date.now().toString() + Math.random().toString(), 
      sender, 
      text, 
      timestamp: new Date(),
      isMetaSuggestion 
    };
    setChatHistory(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleInitialSymptomSubmit = useCallback(async (symptoms: string) => {
    if (!symptoms.trim()) {
      setError("To help me understand, could you please describe your symptoms?");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentMetaSymptomQuestions([]);

    addMessageToChat('user', symptoms);
    
    const aiResponse = await getInitialAssessmentAndQuestion(symptoms, [], patientProfile || undefined);
    if (aiResponse && aiResponse.question) {
      addMessageToChat('ai', aiResponse.question);
      if (aiResponse.metaSymptomQuestions && aiResponse.metaSymptomQuestions.length > 0) {
        setCurrentMetaSymptomQuestions(aiResponse.metaSymptomQuestions);
      }
    } else {
      setError("I'm having a little trouble processing that. Could you please try rephrasing?");
      addMessageToChat('system', "Error: Could not get a response from AI for initial symptoms.");
    }
    setIsLoading(false);
  }, [patientProfile]); 

   useEffect(() => {
    if (initialSymptoms && existingChatHistory.length === 0) { 
      handleInitialSymptomSubmit(initialSymptoms);
    }
  }, [initialSymptoms, existingChatHistory.length, handleInitialSymptomSubmit]);


  const handleSendMessage = async (messageText?: string) => {
    const currentMessage = (messageText || userInput).trim();

    if (!currentMessage && chatHistory.length === 0) { // For initial submission via enter if text area is used
      handleInitialSymptomSubmit(symptomsText || currentMessage);
      setUserInput('');
      return;
    }
    if (!currentMessage) return;

    setIsLoading(true);
    setError(null);
    setCurrentMetaSymptomQuestions([]); // Clear old meta questions once user responds
    
    const newUserMessage = addMessageToChat('user', currentMessage);
    // For API calls, use up-to-date history. ChatHistory state updates asynchronously.
    const updatedChatHistoryForApi = [...chatHistory, newUserMessage]; 
    setUserInput('');

    const userMessagesCount = updatedChatHistoryForApi.filter(m => m.sender === 'user').length;
    
    // Heuristic: try for diagnosis after 2-3 user turns, or if AI indicated 'isFinal' (not explicitly tracked here, but could be)
    if (userMessagesCount > 2) { 
      const diagnosisResult = await getProvisionalDiagnosis(updatedChatHistoryForApi, patientProfile || undefined);
      if (diagnosisResult) {
         addMessageToChat('ai', `${diagnosisResult.summaryForPatient} ${diagnosisResult.nextSteps || ''}`);
        if (diagnosisResult.condition || diagnosisResult.confidence !== 'insufficient information') {
            const fullSymptomsText = updatedChatHistoryForApi.filter(m => m.sender === 'user').map(m => m.text).join('; ');
            onNextStage(diagnosisResult, fullSymptomsText, updatedChatHistoryForApi);
        } else {
            // If diagnosis is not confident, ask another question
            const nextQuestionResponse = await getInitialAssessmentAndQuestion(currentMessage, updatedChatHistoryForApi, patientProfile || undefined);
            if (nextQuestionResponse?.question) {
                addMessageToChat('ai', nextQuestionResponse.question);
                if (nextQuestionResponse.metaSymptomQuestions && nextQuestionResponse.metaSymptomQuestions.length > 0) {
                    setCurrentMetaSymptomQuestions(nextQuestionResponse.metaSymptomQuestions);
                }
            } else {
                 addMessageToChat('ai', "I'm not sure what to ask next. Could you tell me a bit more about how you're feeling overall?");
            }
        }
      } else {
        setError("I'm finding it difficult to form an assessment. Could we try discussing your symptoms again, perhaps with more detail?");
        addMessageToChat('system', "Error: Could not obtain a provisional diagnosis.");
      }
    } else { // Ask another question
      const aiResponse = await getInitialAssessmentAndQuestion(currentMessage, updatedChatHistoryForApi, patientProfile || undefined);
      if (aiResponse && aiResponse.question) {
        addMessageToChat('ai', aiResponse.question);
        if (aiResponse.metaSymptomQuestions && aiResponse.metaSymptomQuestions.length > 0) {
           setCurrentMetaSymptomQuestions(aiResponse.metaSymptomQuestions);
        }
      } else {
        setError("I'm having a little trouble with that. Could you perhaps rephrase or add more details?");
        addMessageToChat('system', "Error: Could not get further questions from AI.");
      }
    }
    setIsLoading(false);
  };
  
  const handleMetaQuestionOptionClick = (questionPrompt: string, option: string) => {
    const responseText = `${questionPrompt} ${option}.`;
    setUserInput(prev => prev ? `${prev} ${responseText}` : responseText);
    // Optionally, clear currentMetaSymptomQuestions here or wait for send
  };

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported by your browser.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setError("Microphone access granted (simulated recording). Please type your symptoms as if spoken, then click Send or press Enter.");
      setTimeout(() => {
        setIsRecording(false);
        if (error === "Microphone access granted (simulated recording). Please type your symptoms as if spoken, then click Send or press Enter.") {
            setError(null);
        }
      }, 5000);
    } catch (err) {
      setError("Microphone access denied. Please enable microphone permissions in your browser settings.");
      console.error("Microphone access error:", err);
    }
  };


  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col" style={{minHeight: '70vh'}}>
      <h2 className="text-2xl font-semibold text-slate-700 mb-2 text-center">Symptom Checker</h2>
      <p className="text-sm text-slate-600 mb-6 text-center">
        {patientProfile && (patientProfile.age || patientProfile.pastHistory || patientProfile.habits) ? "Thanks for sharing your profile. " : ""}
        Let's talk about how you're feeling. Describe your symptoms, and our AI assistant will ask some questions to understand your condition better.
      </p>

      {chatHistory.length === 0 && (
        <div className="mb-4">
          <textarea
            value={symptomsText}
            onChange={(e) => setSymptomsText(e.target.value)}
            placeholder="Please tell me about your main symptoms. For example, 'I've had a headache and felt tired for the last two days.'"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow custom-scrollbar"
            rows={4}
            disabled={isLoading || chatHistory.length > 0}
            aria-label="Initial symptom input"
          />
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={handleVoiceInput}
              className="p-2 text-blue-600 hover:text-blue-800 transition-colors flex items-center"
              disabled={isLoading || isRecording || chatHistory.length > 0}
              title="Record symptoms (simulated)"
            >
              <Icons.Microphone className="w-5 h-5 mr-2" />
              {isRecording ? 'Recording (Simulated)...' : 'Use Microphone'}
            </button>
            <button
              onClick={() => handleInitialSymptomSubmit(symptomsText)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow hover:shadow-md flex items-center"
              disabled={isLoading || !symptomsText.trim() || chatHistory.length > 0}
            >
              <Icons.Sparkles className="w-5 h-5 mr-2" />
              Start Conversation
            </button>
          </div>
        </div>
      )}

      {chatHistory.length > 0 && (
        <div className="flex-grow bg-slate-50 p-4 rounded-lg mb-4 overflow-y-auto custom-scrollbar h-64 md:h-96" aria-live="polite">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : msg.sender === 'ai' ? (msg.isMetaSuggestion ? 'bg-transparent text-slate-600 text-sm' : 'bg-slate-200 text-slate-800 rounded-bl-none') : 'bg-red-100 text-red-700 text-sm'}`}>
                <p className="text-sm">{msg.text}</p>
                {!msg.isMetaSuggestion && <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'} text-right`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </div>
          ))}
          {currentMetaSymptomQuestions.length > 0 && !isLoading && (
            <div className="my-3 ml-2 space-y-3">
              {currentMetaSymptomQuestions.map((metaQ, index) => (
                <div key={index} className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                  <p className="text-sm font-medium text-sky-700 mb-2">{metaQ.prompt}</p>
                  <div className="flex flex-wrap gap-2">
                    {metaQ.options.map(option => (
                      <button
                        key={option}
                        onClick={() => handleMetaQuestionOptionClick(metaQ.prompt, option)}
                        className="bg-sky-100 text-sky-700 hover:bg-sky-200 text-xs font-medium px-2.5 py-1.5 rounded-full border border-sky-300 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}
      
      {isLoading && <LoadingSpinner text="AI is thinking..." />}
      {error && <p role="alert" className="text-red-500 text-sm my-2 text-center">{error}</p>}

      {chatHistory.length > 0 && !isLoading && ( 
        <div className="mt-auto flex items-center border-t border-slate-200 pt-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Type your answer here, or click suggestions above..."
            className="flex-grow p-3 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button
            onClick={() => handleSendMessage()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-lg transition-colors"
            disabled={isLoading || !userInput.trim()}
            aria-label="Send message"
          >
            <Icons.Send className="w-6 h-6"/>
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomInputStage;
