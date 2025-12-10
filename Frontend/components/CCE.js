// components/CCE.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import GlobalHeader from './GlobalHeader';
import ControlsPanel from './ControlsPanel';
import PatientSidebar from './PatientSidebar';
import CCENotes from './CCENotes';
import CustomerDetailsForm from './CustomerDetailsForm';

const CCE = ({ user }) => {
  // YOUR EXISTING STATE - Keep as is
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedModel, setSelectedModel] = useState('nova-lite');
  const [selectedContext, setSelectedContext] = useState('Generic');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [sessionActive, setSessionActive] = useState(false);
  const [vadEnabled, setVadEnabled] = useState(false);
  const [speechInProgress, setSpeechInProgress] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Patient-related state
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [error, setError] = useState(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('customer-details');

  // Extracted info from conversation (for auto-filling form)
  const [extractedInfo, setExtractedInfo] = useState(null);

  // YOUR EXISTING REFS
  const fileInputRef = useRef(null);

  // Fetch patients on mount
  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Patient fetching functions
  const fetchAllPatients = async () => {
    setIsLoadingPatients(true);
    setError(null);

    try {
      const response = await fetch('/api/patients');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAllPatients(data);
      console.log('Loaded patients:', data.length);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error.message);
      setAllPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchPatientById = async (patientId) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.error ? null : data;
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      return null;
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatientId(patient.patient_id);
    const freshPatientData = await fetchPatientById(patient.patient_id);
    setPatientData(freshPatientData || patient);
    console.log('Selected patient:', freshPatientData || patient);
  };

  // YOUR EXISTING FUNCTIONS
  const toggleRecording = () => {
    if (!patientData) {
      alert('Please select a patient before recording');
      return;
    }
    setIsRecording(!isRecording);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!patientData) {
      alert('Please select a patient before uploading files');
      event.target.value = '';
      return;
    }

    console.log('File selected:', file.name);
  };

  const clearAll = () => {
    setTranscript('');
    setIsRecording(false);
    setSessionActive(false);
    setVadEnabled(false);
    setSpeechInProgress(false);
    console.log('All data cleared');
  };

  // Tab configuration
  const tabs = [
    { id: 'customer-details', label: 'Customer Details Form', icon: '📋' },
    { id: 'cce-notes', label: 'CCE Notes', icon: '📝' },
    { id: 'quotation', label: 'Quotation Submission', icon: '💰' },
    { id: 'approval', label: 'Approval Status', icon: '✅' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader user={user} />

      {/* Error Message */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Grid Layout Container */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Patient Sidebar - Left Side (25%) */}
          <div className="lg:col-span-3">
            <PatientSidebar
              allPatients={allPatients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={handleSelectPatient}
              patientData={patientData}
              isLoadingPatients={isLoadingPatients}
            />
          </div>

          {/* Main Content - Right Side (75%) */}
          <div className="lg:col-span-9">
            
            {/* Patient Info Banner */}
            {patientData && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Recording for: {patientData.name}
                    </h3>
                    <p className="text-sm text-blue-700">
                      MPID: {patientData.mpid} • Phone: {patientData.phone_number}
                    </p>
                    {patientData.customer_edd && (
                      <p className="text-xs text-blue-600 mt-1">
                        EDD: {new Date(patientData.customer_edd).toLocaleDateString()} • 
                        {patientData.first_pregnancy ? ' First Pregnancy' : ' Not First Pregnancy'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatientId(null);
                      setPatientData(null);
                    }}
                    className="px-4 py-2 text-sm bg-white text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                  >
                    Change Patient
                  </button>
                </div>
              </div>
            )}

            {/* Recording Controls Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <ControlsPanel
                isRecording={isRecording}
                toggleRecording={toggleRecording}
                handleFileUpload={handleFileUpload}
                clearAll={clearAll}
                fileInputRef={fileInputRef}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                selectedContext={selectedContext}
                setSelectedContext={setSelectedContext}
                connectionStatus={connectionStatus}
                sessionActive={sessionActive}
                vadEnabled={vadEnabled}
                speechInProgress={speechInProgress}
                isEndingSession={isEndingSession}
                transcript={transcript}
                selectedPatient={patientData}
              />
            </div>

            {/* Tab Navigation */}
            <div className="mb-4 border-b border-gray-200 bg-white rounded-t-lg">
              <nav className="-mb-px flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    } flex-1 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors flex items-center justify-center space-x-2`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-lg shadow-sm p-6">
              {!patientData ? (
                <div className="text-center py-16 text-gray-500">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-xl font-medium">Please select a patient from the left sidebar</p>
                </div>
              ) : (
                <>
                  {activeTab === 'customer-details' && (
                    <CustomerDetailsForm 
                      patientData={patientData}
                      extractedInfo={extractedInfo}
                    />
                  )}

                  {activeTab === 'cce-notes' && (
                    <CCENotes patientId={selectedPatientId} />
                  )}

                  {activeTab === 'quotation' && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">Quotation Submission</p>
                      <p className="text-sm mt-2">This feature is coming soon...</p>
                    </div>
                  )}

                  {activeTab === 'approval' && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-medium">Approval Status</p>
                      <p className="text-sm mt-2">This feature is coming soon...</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

CCE.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    sub: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string
  })
};

export default CCE;