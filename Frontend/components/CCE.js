//MedicalTranscriptionSystem.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import GlobalHeader from './GlobalHeader';
import ControlsPanel from './ControlsPanel';
import PatientSidebar from './PatientSidebar';

const MedicalTranscriptionSystem = ({ user }) => {
  // State management
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

  // Refs
  const fileInputRef = useRef(null);

  // Fetch all patients on component mount
  useEffect(() => {
    fetchAllPatients();
  }, []);

  const fetchAllPatients = async () => {
    setIsLoadingPatients(true);
    try {
      // Replace this with your actual API call
      const response = await fetch('/api/patients');
      const data = await response.json();
      setAllPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback to mock data for development
      setAllPatients([
        {
          patient_id: 1001,
          patient_name: 'John Doe',
          age: 45,
          gender: 'Male',
          phone_number: '+1234567890',
          weight: 75,
          height: 175,
          bmi: 24.5,
          blood_group: 'O+',
          allergies: ['Penicillin', 'Peanuts'],
          medical_history: ['Hypertension', 'Diabetes Type 2'],
          current_medication: ['Metformin', 'Lisinopril'],
          customer_edd: '2024-06-15',
          booking_status: 'Confirmed',
          lead_status: 'Assured'
        },
        {
          patient_id: 1002,
          patient_name: 'Jane Smith',
          age: 32,
          gender: 'Female',
          phone_number: '+1234567891',
          weight: 62,
          height: 165,
          bmi: 22.8,
          blood_group: 'A+',
          allergies: [],
          medical_history: ['Asthma'],
          current_medication: ['Albuterol'],
          customer_edd: '2024-05-20',
          booking_status: 'Pending',
          lead_status: 'New'
        }
      ]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.patient_id);
    setPatientData(patient);
    console.log('Selected patient:', patient);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Add your recording logic here
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name);
    // Add your file upload logic here
  };

  const clearAll = () => {
    setTranscript('');
    setIsRecording(false);
    setSessionActive(false);
    setVadEnabled(false);
    setSpeechInProgress(false);
    console.log('All data cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader user={user} />

      {/* Patient Sidebar */}
      <PatientSidebar
        allPatients={allPatients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        patientData={patientData}
        isLoadingPatients={isLoadingPatients}
      />

      {/* Main Content - shifted right to accommodate sidebar */}
      <div className="ml-80">
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
    </div>
  );
};

MedicalTranscriptionSystem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    sub: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string
  })
};

export default MedicalTranscriptionSystem;