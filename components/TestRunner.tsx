import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import AIPCTestSuite from '../tests/aipcTestSuite';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  responseTime: number;
  actualResponse?: any;
  expectedCriteria?: any;
}

const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [showDetails, setShowDetails] = useState<Set<number>>(new Set());

  const testSuite = new AIPCTestSuite();

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setCurrentTest('Initializing test suite...');

    try {
      // Simulate progress updates
      const testCategories = [
        'Specialty-Aware Diagnosis',
        'Drug Interaction Checking', 
        'Automated Treatment Plans',
        'Enhanced Note Features'
      ];

      for (let i = 0; i < testCategories.length; i++) {
        setCurrentTest(`Running ${testCategories[i]} tests...`);
        setProgress(((i + 1) / testCategories.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate test time
      }

      const testResults = await testSuite.runAllTests();
      setResults(testResults);
      setCurrentTest('Tests completed');
      setProgress(100);
    } catch (error) {
      console.error('Test execution failed:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDetails = (index: number) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(index)) {
      newShowDetails.delete(index);
    } else {
      newShowDetails.add(index);
    }
    setShowDetails(newShowDetails);
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <Icons.CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <Icons.XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50';
  };

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const averageResponseTime = totalTests > 0 
    ? results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests 
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Icons.TestTube className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              AIPC System Test Suite
            </h2>
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isRunning ? (
              <>
                <Icons.Loader className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Icons.Play className="h-4 w-4 mr-2" />
                Run All Tests
              </>
            )}
          </button>
        </div>

        <p className="text-gray-600">
          Comprehensive testing of AI-assisted clinical decision support features including 
          specialty-aware diagnosis, drug interaction checking, and automated treatment planning.
        </p>
      </div>

      {/* Progress Section */}
      {isRunning && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Icons.Clock className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-lg font-medium text-gray-900">
              {currentTest}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-right text-sm text-gray-600 mt-2">
            {Math.round(progress)}% Complete
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Test Results Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
              <div className="text-sm text-blue-800">Total Tests</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-green-800">Passed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{Math.round(averageResponseTime)}ms</div>
              <div className="text-sm text-purple-800">Avg Response</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900 mr-3">
                Pass Rate: {passRate.toFixed(1)}%
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${passRate >= 80 ? 'bg-green-500' : passRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${passRate}%` }}
                ></div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              passRate >= 80 ? 'bg-green-100 text-green-800' : 
              passRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {passRate >= 80 ? 'Excellent' : passRate >= 60 ? 'Good' : 'Needs Attention'}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Test Results</h3>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDetails(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(result.passed)}
                      <span className="ml-3 font-medium text-gray-900">
                        {result.testName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {result.responseTime}ms
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.passed)}`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      <Icons.ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                        showDetails.has(index) ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>

                {showDetails.has(index) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Details:</strong> {result.details}
                      </p>
                      
                      {result.actualResponse && (
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-xs font-medium text-gray-800 mb-2">Response Preview:</p>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(result.actualResponse, null, 2).substring(0, 300)}
                            {JSON.stringify(result.actualResponse, null, 2).length > 300 ? '...' : ''}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isRunning && results.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Icons.TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Ready to Test AIPC System
          </h3>
          <p className="text-gray-600 mb-6">
            Click "Run All Tests" to validate the AI-assisted clinical decision support features.
          </p>
          <button
            onClick={runTests}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Icons.Play className="h-5 w-5 mr-2" />
            Start Testing
          </button>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
