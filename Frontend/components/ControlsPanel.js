//ControlsPanel.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Square, Upload, Send, Wifi, WifiOff, Radio, Loader2, AlertCircle
} from 'lucide-react';

const ControlsPanel = ({
  isRecording,
  toggleRecording,
  handleFileUpload,
  clearAll,
  fileInputRef,
  connectionStatus,
  sessionActive,
  vadEnabled,
  speechInProgress,
  isEndingSession,
  transcript
}) => {
  const [localEndingSession, setLocalEndingSession] = useState(false);
  const [waitingForSessionEnd, setWaitingForSessionEnd] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');

  const inactivityTimer = useRef(null);
  const lastActivityTime = useRef(Date.now());

  const handleSubmit = async () => {
    setLocalEndingSession(true);
    setWaitingForSessionEnd(true);
    try {
      await clearAll();
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLocalEndingSession(false);
      setShowInactivityWarning(false);
    }
  };

  const resetInactivityTimer = () => {
    lastActivityTime.current = Date.now();
    setShowInactivityWarning(false);
  };

  const handleContinueSession = () => {
    resetInactivityTimer();
    setShowInactivityWarning(false);

    if (isRecording) {
      console.log('Session continued - recording still active');
    } else {
      console.log('Session continued - click Start to resume recording');
    }
  };

  useEffect(() => {
    if (!sessionActive) return;

    inactivityTimer.current = setInterval(() => {
      const now = Date.now();
      const diffMinutes = (now - lastActivityTime.current) / (1000 * 60);

      if (sessionActive && !isRecording && diffMinutes >= 1) {
        if (!showInactivityWarning) setShowInactivityWarning(true);
      }
    }, 30 * 1000);

    return () => clearInterval(inactivityTimer.current);
  }, [sessionActive, isRecording, showInactivityWarning]);

  useEffect(() => {
    resetInactivityTimer();
  }, [isRecording, transcript]);

  useEffect(() => {
    if (!sessionActive) {
      setWaitingForSessionEnd(false);
    }
  }, [sessionActive]);

  const isActuallyEnding = localEndingSession || isEndingSession;
  const isTransitioning = isActuallyEnding || waitingForSessionEnd;

  return (
    <div className="relative bg-white border-b border-gray-200 p-4">
      <div className="w-full px-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selection */}
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              resetInactivityTimer();
            }}
            disabled={isTransitioning}
            className={`px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi</option>
            <option value="ta-IN">Tamil (US)</option>
            <option value="kn-IN">Kannada</option>
            <option value="ml-IN">Malayalam</option>
            <option value="mr-IN">Marathi</option>
            <option value="bn-IN">Bengali</option>
            <option value="gu-IN">Gujarati</option>
          </select>



          {/* Recording Button */}
          <button
            onClick={() => {
              toggleRecording();
              resetInactivityTimer();
            }}
            disabled={isTransitioning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
            } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? 'Stop' : 'Start'}
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.flac,.ogg,.webm"
            onChange={(e) => {
              handleFileUpload(e);
              resetInactivityTimer();
            }}
            disabled={isTransitioning}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTransitioning}
            className={`flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isTransitioning}
            className={`flex items-center gap-2 px-4 py-2 ${
              isTransitioning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-xl text-sm font-medium transition-colors`}
          >
            {isTransitioning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Please Wait...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit
              </>
            )}
          </button>

          {/* Connection Status */}
          {/* <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-xl text-sm">
            <div className="flex items-center gap-1">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span>
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {sessionActive ? (
                <Radio className="h-3 w-3 text-green-500 animate-pulse" />
              ) : (
                <Radio className="h-3 w-3 text-gray-500" />
              )}
              <span>{sessionActive ? 'Session Active' : 'No Session'}</span>
            </div>
          </div> */}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-xl text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Recording
            </div>
          )}
        </div>

        {/* Note */}
        {sessionActive && !isTransitioning && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-800 font-medium text-sm">
                  <span className="font-semibold">Note:</span> Please submit the session to save the data correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Saving / Transition Message */}
        {isTransitioning && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium text-base">
                Please wait as we are submitting your session...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-md border-2 border-gray-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Session Inactivity Detected
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              No voice recording detected for the past 1 minute. Would you like to submit this session?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleContinueSession}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Continue Session
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Submit Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlsPanel;