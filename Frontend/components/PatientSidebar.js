'use client';

import { useState, useMemo } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export default function PatientSidebar({
  allPatients,
  selectedPatientId,
  onSelectPatient,
  patientData,
  isLoadingPatients
}) {
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('search'); // 'search', 'recent', 'today', 'followup'

  const getPatientDisplayId = (patientId) => {
    if (!patientId) return '';
    const idStr = String(patientId);
    return idStr.length > 4 ? `...${idStr.slice(-4)}` : idStr;
  };

  const filteredPatients = useMemo(() => {
    let filtered = allPatients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((patient) =>
        patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPatientDisplayId(patient.patient_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone_number && patient.phone_number.includes(searchTerm))
      );
    }

    // Apply additional filters based on active filter
    // You can customize these based on your data structure
    switch (activeFilter) {
      case 'recent':
        // Filter recent appointments - customize based on your data
        filtered = filtered.filter((patient) => patient.recent_appointment);
        break;
      case 'today':
        // Filter today's appointments - customize based on your data
        filtered = filtered.filter((patient) => patient.today_appointment);
        break;
      case 'followup':
        // Filter follow-up patients - customize based on your data
        filtered = filtered.filter((patient) => patient.needs_followup);
        break;
      default:
        // 'search' - no additional filtering
        break;
    }

    return filtered;
  }, [searchTerm, allPatients, activeFilter]);

  const handleSelectPatient = (patient) => {
    onSelectPatient(patient);
    setShowPatientDropdown(false);
    setSearchTerm('');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-80 bg-gray-800 dark:bg-gray-900 text-gray-100 p-4 overflow-y-auto z-10">
      {/* Patient Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Patient Selection</h2>
        
        <div className="relative">
          <button
            onClick={() => setShowPatientDropdown(!showPatientDropdown)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center space-x-2 w-full justify-between"
            disabled={isLoadingPatients}
          >
            {isLoadingPatients ? (
              <span>Loading patients...</span>
            ) : (
              <>
                <span className="truncate">
                  {patientData?.patient_name || 'Select Patient'}
                  {patientData && ` (${getPatientDisplayId(selectedPatientId)})`}
                </span>
                <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
              </>
            )}
          </button>

          {showPatientDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-10 w-full max-h-[500px] overflow-hidden flex flex-col">
              {/* Search Input */}
              <div className="p-2 border-b dark:border-gray-700">
                <input
                  type="text"
                  className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by name, ID, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Buttons */}
              <div className="p-2 border-b dark:border-gray-700 space-y-1">
                <button
                  onClick={() => setActiveFilter('search')}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeFilter === 'search'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  🔍 Search Customers
                </button>
                <button
                  onClick={() => setActiveFilter('recent')}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeFilter === 'recent'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📅 Recent Appointments
                </button>
                <button
                  onClick={() => setActiveFilter('today')}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeFilter === 'today'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📅 Today's Appointments
                </button>
                <button
                  onClick={() => setActiveFilter('followup')}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeFilter === 'followup'
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  📞 Follow-up
                </button>
              </div>

              {/* Patient List */}
              <div className="overflow-y-auto flex-1">
                {filteredPatients.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.patient_id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`w-full text-left p-3 rounded border transition-colors ${
                          selectedPatientId === patient.patient_id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {patient.patient_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ID: {getPatientDisplayId(patient.patient_id)} • Age: {patient.age}
                        </div>
                        {patient.phone_number && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            📱 {patient.phone_number}
                          </div>
                        )}
                        {patient.customer_edd && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              EDD: {patient.customer_edd}
                            </span>
                            {patient.booking_status && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                patient.lead_status === 'Assured'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {patient.booking_status}
                              </span>
                            )}
                          </div>
                        )}
                        {selectedPatientId === patient.patient_id && (
                          <div className="text-blue-600 dark:text-blue-300 text-right mt-1">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No patients found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Details */}
      <div className="bg-gray-700 dark:bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-4 border-b border-gray-600 pb-2">
          Patient Details
        </h2>

        {patientData ? (
          <div className="space-y-3">
            <DetailItem label="Name" value={patientData.patient_name} />
            <DetailItem label="ID" value={patientData.patient_id} />
            <DetailItem label="Gender" value={patientData.gender} />
            <DetailItem label="Age" value={`${patientData.age} years`} />
            <DetailItem label="Weight" value={`${patientData.weight ?? '--'} kg`} />
            <DetailItem label="Height" value={`${patientData.height ?? '--'} cm`} />
            <DetailItem label="BMI" value={patientData.bmi ?? '--'} />
            <DetailItem label="Blood Group" value={patientData.blood_group ?? '--'} />

            <DetailSection label="Allergies">
              {Array.isArray(patientData.allergies) && patientData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patientData.allergies.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium shadow"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <span>No allergies recorded</span>
              )}
            </DetailSection>

            <DetailSection label="Medical History">
              {Array.isArray(patientData.medical_history) && patientData.medical_history.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patientData.medical_history.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <span>No medical history recorded</span>
              )}
            </DetailSection>

            <DetailSection label="Current Medications">
              {Array.isArray(patientData.current_medication) && patientData.current_medication.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patientData.current_medication.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <span>No current medications</span>
              )}
            </DetailSection>
          </div>
        ) : (
          <p>No patient data available</p>
        )}
      </div>
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="font-medium text-gray-300">{label}:</span>
    <span>{value}</span>
  </div>
);

const DetailSection = ({ label, children }) => (
  <div>
    <h3 className="font-medium text-gray-300 mt-3 mb-1">{label}:</h3>
    <div className="bg-gray-600 dark:bg-gray-700 rounded p-2">{children}</div>
  </div>
);