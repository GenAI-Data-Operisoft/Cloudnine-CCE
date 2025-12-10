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
  const [activeFilter, setActiveFilter] = useState('search');

  const getPatientDisplayId = (mpid) => {
    if (!mpid) return '';
    const idStr = String(mpid);
    return idStr.length > 4 ? `...${idStr.slice(-4)}` : idStr;
  };

  const filteredPatients = useMemo(() => {
    let filtered = allPatients;

    if (searchTerm) {
      filtered = filtered.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.mpid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone_number && patient.phone_number.includes(searchTerm))
      );
    }

    switch (activeFilter) {
      case 'recent':
        // Filter patients with recent follow_up_date
        filtered = filtered.filter((patient) => {
          if (!patient.follow_up_date) return false;
          const followUpDate = new Date(patient.follow_up_date);
          const today = new Date();
          const daysDiff = Math.floor((followUpDate - today) / (1000 * 60 * 60 * 24));
          return daysDiff >= -7 && daysDiff <= 7;
        });
        break;
      case 'today':
        // Filter patients with follow_up_date today
        filtered = filtered.filter((patient) => {
          if (!patient.follow_up_date) return false;
          const followUpDate = new Date(patient.follow_up_date);
          const today = new Date();
          return followUpDate.toDateString() === today.toDateString();
        });
        break;
      case 'followup':
        // Filter patients that need follow-up
        filtered = filtered.filter((patient) => 
          patient.lead_status === 'Expected to book' || 
          patient.lead_status === 'Not explained yet' ||
          patient.booking_status === 'No interaction'
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [searchTerm, allPatients, activeFilter]);

  const handleSelectPatient = (patient) => {
    onSelectPatient(patient);
    setShowPatientDropdown(false);
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Search Customers</h2>
      
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by MPID/mobile/name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
        />
      </div>

      {/* Filter Buttons */}
      <div className="mb-4 space-y-2">
        <button
          onClick={() => setActiveFilter('search')}
          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
            activeFilter === 'search'
              ? 'bg-purple-50 text-purple-700'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          🔍 Search Customers
        </button>
        <button
          onClick={() => setActiveFilter('recent')}
          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
            activeFilter === 'recent'
              ? 'bg-purple-50 text-purple-700'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          📅 Recent Follow-ups
        </button>
        <button
          onClick={() => setActiveFilter('today')}
          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
            activeFilter === 'today'
              ? 'bg-purple-50 text-purple-700'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          📅 Today's Follow-ups
        </button>
        <button
          onClick={() => setActiveFilter('followup')}
          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
            activeFilter === 'followup'
              ? 'bg-purple-50 text-purple-700'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          📞 Needs Follow-up
        </button>
        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded text-gray-700">
          📊 View Lead Stats
        </button>
      </div>

      {/* Patient List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoadingPatients && (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        )}
        
        {!isLoadingPatients && filteredPatients.length === 0 && (
          <div className="text-center py-4 text-gray-500">No patients found</div>
        )}
        
        {!isLoadingPatients && filteredPatients.map((patient) => (
          <div
            key={patient.patient_id}
            onClick={() => handleSelectPatient(patient)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedPatientId === patient.patient_id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm text-gray-900">{patient.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {patient.phone_number || 'No phone'}
            </div>
            <div className="text-xs text-gray-500">
              MPID: {getPatientDisplayId(patient.mpid)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">
                EDD: {formatDate(patient.customer_edd)}
              </span>
              {patient.lead_status && (
                <span className={`text-xs px-2 py-1 rounded ${
                  patient.lead_status === 'Assured' 
                    ? 'bg-green-100 text-green-700'
                    : patient.lead_status === 'Expected to book'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {patient.lead_status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Patient Details Section - Shows when patient is selected */}
      {patientData && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Selected Patient</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <DetailItem label="Name" value={patientData.name} />
            <DetailItem label="MPID" value={patientData.mpid} />
            <DetailItem label="Phone" value={patientData.phone_number} />
            {patientData.email && (
              <DetailItem label="Email" value={patientData.email} />
            )}
            <DetailItem label="EDD" value={formatDate(patientData.customer_edd)} />
            <DetailItem 
              label="First Pregnancy" 
              value={patientData.first_pregnancy ? 'Yes' : 'No'} 
            />
            
            {/* Lead Information */}
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">Lead Information</div>
              <DetailItem label="Lead Status" value={patientData.lead_status || 'N/A'} />
              <DetailItem label="Booking Status" value={patientData.booking_status || 'N/A'} />
              {patientData.follow_up_date && (
                <DetailItem 
                  label="Follow-up Date" 
                  value={formatDate(patientData.follow_up_date)} 
                />
              )}
              {patientData.package_interest && (
                <DetailItem label="Package Interest" value={patientData.package_interest} />
              )}
            </div>

            {/* Additional Information */}
            {(patientData.customer_location || patientData.insurance_status) && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="text-xs font-semibold text-gray-700 mb-2">Additional Info</div>
                {patientData.customer_location && (
                  <DetailItem label="Location" value={patientData.customer_location} />
                )}
                {patientData.insurance_status && (
                  <DetailItem label="Insurance" value={patientData.insurance_status} />
                )}
                {patientData.doctor_preference && (
                  <DetailItem label="Doctor Preference" value={patientData.doctor_preference} />
                )}
              </div>
            )}

            {/* Notes preview if available */}
            {patientData.notes && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="text-xs font-semibold text-gray-700 mb-1">Latest Notes</div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded">
                  {patientData.notes.length > 100 
                    ? `${patientData.notes.substring(0, 100)}...` 
                    : patientData.notes
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900">{value || 'N/A'}</span>
  </div>
);