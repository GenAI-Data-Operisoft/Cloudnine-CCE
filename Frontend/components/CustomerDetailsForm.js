// components/CustomerDetailsForm.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CustomerDetailsForm = ({ patientData, extractedInfo }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [updatedFields, setUpdatedFields] = useState(new Set());
  const [newFields, setNewFields] = useState(new Set());

  // Initialize form with existing patient data from PostgreSQL
  useEffect(() => {
    if (patientData) {
      const existingData = {};
      
      // Parse scans_done if it's a string
      if (patientData.scans_done) {
        try {
          existingData.scans_done = typeof patientData.scans_done === 'string' 
            ? JSON.parse(patientData.scans_done) 
            : patientData.scans_done;
        } catch {
          existingData.scans_done = [];
        }
      }
      
      // Copy all other fields
      Object.keys(patientData).forEach(key => {
        if (key !== 'scans_done' && patientData[key] !== null && patientData[key] !== undefined) {
          existingData[key] = patientData[key];
        }
      });
      
      setFormData(existingData);
      setUpdatedFields(new Set());
      setNewFields(new Set());
    }
  }, [patientData]);

  // Auto-fill form when extracted info arrives from DynamoDB
  useEffect(() => {
    if (extractedInfo) {
      const autoFilledData = {};
      const updated = new Set();
      const newlyFilled = new Set();
      
      const trackField = (fieldName, newValue) => {
        autoFilledData[fieldName] = newValue;
        if (patientData[fieldName] && patientData[fieldName] !== newValue) {
          updated.add(fieldName);
        } else if (!patientData[fieldName]) {
          newlyFilled.add(fieldName);
        }
      };

      // Map extracted info to form fields
      if (extractedInfo.pregnancy_related) {
        if (extractedInfo.pregnancy_related.customer_edd) {
          trackField('customer_edd', extractedInfo.pregnancy_related.customer_edd);
        }
        if (extractedInfo.pregnancy_related.first_pregnancy !== null) {
          trackField('first_pregnancy', extractedInfo.pregnancy_related.first_pregnancy);
        }
        if (extractedInfo.pregnancy_related.scans_done) {
          trackField('scans_done', extractedInfo.pregnancy_related.scans_done);
        }
        if (extractedInfo.pregnancy_related.having_twins) {
          trackField('having_twins', extractedInfo.pregnancy_related.having_twins);
        }
      }
      
      if (extractedInfo.family_personal) {
        if (extractedInfo.family_personal.customer_location) {
          trackField('customer_location', extractedInfo.family_personal.customer_location);
        }
        if (extractedInfo.family_personal.relatives_living_with) {
          trackField('relatives_living_with', extractedInfo.family_personal.relatives_living_with);
        }
        if (extractedInfo.family_personal.mother_occupation) {
          trackField('mother_occupation', extractedInfo.family_personal.mother_occupation);
        }
        if (extractedInfo.family_personal.father_occupation) {
          trackField('father_occupation', extractedInfo.family_personal.father_occupation);
        }
      }
      
      if (extractedInfo.cloudnine_awareness) {
        if (extractedInfo.cloudnine_awareness.how_learned_cloudnine) {
          trackField('how_learned_cloudnine', extractedInfo.cloudnine_awareness.how_learned_cloudnine);
        }
        if (extractedInfo.cloudnine_awareness.aware_of_packages !== null) {
          trackField('aware_of_packages', extractedInfo.cloudnine_awareness.aware_of_packages);
        }
        if (extractedInfo.cloudnine_awareness.downloaded_app !== null) {
          trackField('downloaded_app', extractedInfo.cloudnine_awareness.downloaded_app);
        }
        if (extractedInfo.cloudnine_awareness.booking_method) {
          trackField('booking_method', extractedInfo.cloudnine_awareness.booking_method);
        }
      }
      
      if (extractedInfo.insurance) {
        if (extractedInfo.insurance.insurance_status) {
          trackField('insurance_status', extractedInfo.insurance.insurance_status);
        }
      }
      
      if (extractedInfo.cce_observations) {
        if (extractedInfo.cce_observations.transport_method) {
          trackField('transport_method', extractedInfo.cce_observations.transport_method);
        }
        if (extractedInfo.cce_observations.mentioned_competitors !== null) {
          trackField('mentioned_competitors', extractedInfo.cce_observations.mentioned_competitors);
        }
        if (extractedInfo.cce_observations.interested_in_facilities !== null) {
          trackField('interested_in_facilities', extractedInfo.cce_observations.interested_in_facilities);
        }
        if (extractedInfo.cce_observations.doctor_preference) {
          trackField('doctor_preference', extractedInfo.cce_observations.doctor_preference);
        }
        if (extractedInfo.cce_observations.doctor_name) {
          trackField('doctor_name', extractedInfo.cce_observations.doctor_name);
        }
        if (extractedInfo.cce_observations.price_inquiry !== null) {
          trackField('price_inquiry', extractedInfo.cce_observations.price_inquiry);
        }
        if (extractedInfo.cce_observations.accompanied_by) {
          trackField('accompanied_by', extractedInfo.cce_observations.accompanied_by);
        }
        if (extractedInfo.cce_observations.brings_other_children) {
          trackField('brings_other_children', extractedInfo.cce_observations.brings_other_children);
        }
        if (extractedInfo.cce_observations.doctor_remark_questions !== null) {
          trackField('doctor_remark_questions', extractedInfo.cce_observations.doctor_remark_questions);
        }
        if (extractedInfo.cce_observations.going_to_native !== null) {
          trackField('going_to_native', extractedInfo.cce_observations.going_to_native);
        }
      }
      
      if (extractedInfo.additional_insights) {
        if (extractedInfo.additional_insights.package_interest) {
          trackField('package_interest', extractedInfo.additional_insights.package_interest);
        }
      }
      
      setFormData(autoFilledData);
      setUpdatedFields(updated);
      setNewFields(newlyFilled);
      setSaveMessage('✨ Form auto-filled from conversation!');
      setTimeout(() => setSaveMessage(''), 5000);
    }
  }, [extractedInfo, patientData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getFieldHighlight = (fieldName) => {
    if (updatedFields.has(fieldName)) {
      return 'bg-yellow-100 border-yellow-400';
    }
    if (newFields.has(fieldName)) {
      return 'bg-green-100 border-green-400';
    }
    return '';
  };

  const handleSave = async () => {
    if (!patientData?.patient_id) {
      setSaveMessage('❌ No patient selected');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const dataToSave = {
        ...formData,
        created_by: 'Manojkumar'
      };

      const response = await fetch('/api/patients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientData.patient_id,
          ...dataToSave
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Clear notes field after successful save
      setFormData((prev) => ({ ...prev, notes: '' }));
      setUpdatedFields(new Set());
      setNewFields(new Set());
      
      setSaveMessage('✅ Details saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage('❌ Failed to save details');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!patientData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-lg font-medium">No Patient Selected</p>
        <p className="text-sm mt-2">Please select a patient from the left sidebar to view details</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Color Legend */}
      {(updatedFields.size > 0 || newFields.size > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Field Status Legend:</h4>
          <div className="flex gap-4 text-xs">
            {newFields.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                <span className="text-gray-700">New information from current conversation</span>
              </div>
            )}
            {updatedFields.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded"></div>
                <span className="text-gray-700">Updated from previous data</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes('✅') || saveMessage.includes('✨') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Pregnancy Related */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Pregnancy Related</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer's EDD <span className="text-gray-400">(Dx App)</span>
            </label>
            <input
              type="date"
              value={formData.customer_edd || patientData.customer_edd?.split('T')[0] || ''}
              onChange={(e) => handleInputChange('customer_edd', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${getFieldHighlight('customer_edd')}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is this customer's first pregnancy? <span className="text-red-500">*</span>
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('first_pregnancy')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="first_pregnancy" 
                  checked={(formData.first_pregnancy !== undefined ? formData.first_pregnancy : patientData.first_pregnancy) === true}
                  onChange={() => handleInputChange('first_pregnancy', true)}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="first_pregnancy" 
                  checked={(formData.first_pregnancy !== undefined ? formData.first_pregnancy : patientData.first_pregnancy) === false}
                  onChange={() => handleInputChange('first_pregnancy', false)}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What scans are done already?
            </label>
            <div className={`grid grid-cols-3 gap-4 p-2 rounded ${getFieldHighlight('scans_done')}`}>
              {['EP Scan', 'NT Scan', 'Anomaly Scan', 'Growth 1', 'Growth 2', 'Other'].map((scan) => (
                <label key={scan} className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={(formData.scans_done || []).includes(scan)}
                    onChange={(e) => {
                      const currentScans = formData.scans_done || [];
                      if (e.target.checked) {
                        handleInputChange('scans_done', [...currentScans, scan]);
                      } else {
                        handleInputChange('scans_done', currentScans.filter((s) => s !== scan));
                      }
                    }}
                    className="mr-2" 
                  />
                  <span className="text-sm">{scan}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is the customer having twins?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('having_twins')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="twins" 
                  checked={formData.having_twins === 'yes'}
                  onChange={() => handleInputChange('having_twins', 'yes')}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="twins" 
                  checked={formData.having_twins === 'no'}
                  onChange={() => handleInputChange('having_twins', 'no')}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="twins" 
                  checked={formData.having_twins === 'more_than_2'}
                  onChange={() => handleInputChange('having_twins', 'more_than_2')}
                  className="mr-2" 
                />
                <span className="text-sm">More than 2</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Family & Personal */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Family & Personal</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Where is the customer from?
            </label>
            <input
              type="text"
              placeholder="location"
              value={formData.customer_location || patientData.customer_location || ''}
              onChange={(e) => handleInputChange('customer_location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${getFieldHighlight('customer_location')}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any relatives living with the customer?
            </label>
            <div className={`grid grid-cols-2 gap-2 p-2 rounded ${getFieldHighlight('relatives_living_with')}`}>
              {[
                { label: 'No', value: 'no' },
                { label: 'Parents/In-laws', value: 'parents_in_laws' },
                { label: 'Siblings', value: 'siblings' },
                { label: 'Others', value: 'others' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input 
                    type="radio" 
                    name="relatives" 
                    checked={formData.relatives_living_with === option.value}
                    onChange={() => handleInputChange('relatives_living_with', option.value)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What does the expecting mother do for work?
            </label>
            <div className={`grid grid-cols-2 gap-2 p-2 rounded ${getFieldHighlight('mother_occupation')}`}>
              {['salaried', 'business', 'housemate', 'other'].map((option) => (
                <label key={option} className="flex items-center">
                  <input 
                    type="radio" 
                    name="mother_work" 
                    checked={formData.mother_occupation === option}
                    onChange={() => handleInputChange('mother_occupation', option)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What does the expecting father do for work?
            </label>
            <div className={`grid grid-cols-2 gap-2 p-2 rounded ${getFieldHighlight('father_occupation')}`}>
              {['salaried', 'business', 'housemate', 'other'].map((option) => (
                <label key={option} className="flex items-center">
                  <input 
                    type="radio" 
                    name="father_work" 
                    checked={formData.father_occupation === option}
                    onChange={() => handleInputChange('father_occupation', option)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cloudnine Awareness */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Cloudnine Awareness</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How did you learn about Cloudnine?
            </label>
            <div className={`grid grid-cols-2 gap-3 p-2 rounded ${getFieldHighlight('how_learned_cloudnine')}`}>
              {[
                { label: 'Family/Relatives who delivered here', value: 'family_relatives' },
                { label: 'Friends/Colleagues/Others who delivered here', value: 'friends_colleagues' },
                { label: 'Online search – Google, Practo, etc', value: 'online_search' },
                { label: 'Past Cloudnine Fertility customer', value: 'past_customer_fertility' },
                { label: 'Past Cloudnine Gynaecology customer', value: 'past_customer_gynecology' },
                { label: 'Past Cloudnine Maternity customer', value: 'past_customer_maternity' },
                { label: 'Brand presence on social media', value: 'social_media' },
                { label: 'Physical brand presence/Saw hospitals and associated clinics in city', value: 'physical_presence' },
                { label: 'Doctor recommendation (DRM)', value: 'doctor_recommendation' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input 
                    type="radio" 
                    name="awareness" 
                    checked={formData.how_learned_cloudnine === option.value}
                    onChange={() => handleInputChange('how_learned_cloudnine', option.value)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is the customer aware of Cloudnine's birthing packages?
              </label>
              <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('aware_of_packages')}`}>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="aware_packages" 
                    checked={formData.aware_of_packages === true}
                    onChange={() => handleInputChange('aware_of_packages', true)}
                    className="mr-2" 
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="aware_packages" 
                    checked={formData.aware_of_packages === false}
                    onChange={() => handleInputChange('aware_of_packages', false)}
                    className="mr-2" 
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Has customer downloaded the app?
              </label>
              <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('downloaded_app')}`}>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="downloaded_app" 
                    checked={formData.downloaded_app === true}
                    onChange={() => handleInputChange('downloaded_app', true)}
                    className="mr-2" 
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="downloaded_app" 
                    checked={formData.downloaded_app === false}
                    onChange={() => handleInputChange('downloaded_app', false)}
                    className="mr-2" 
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How does customer book appointments?
            </label>
            <div className={`grid grid-cols-3 gap-3 p-2 rounded ${getFieldHighlight('booking_method')}`}>
              {[
                { label: 'Walk-in', value: 'walk_in' },
                { label: 'App', value: 'app' },
                { label: 'Call centre', value: 'call_centre' },
                { label: 'Call to CCE', value: 'call_to_cce' },
                { label: 'Practo or other external partners', value: 'practo' },
                { label: 'Chatbot', value: 'chatbot' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input 
                    type="radio" 
                    name="booking_method" 
                    checked={formData.booking_method === option.value}
                    onChange={() => handleInputChange('booking_method', option.value)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Insurance</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Does customer have insurance? <span className="text-red-500">*</span>
          </label>
          <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('insurance_status')}`}>
            {[
              { label: 'Single insurance', value: 'single_insurance' },
              { label: 'Dual insurance', value: 'dual_insurance' },
              { label: 'No', value: 'no' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input 
                  type="radio" 
                  name="insurance"
                  checked={formData.insurance_status === option.value}
                  onChange={() => handleInputChange('insurance_status', option.value)}
                  className="mr-2" 
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* CCE Observations */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">CCE Observations (Observed during informal conversations)</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How did customer come to hospital?
            </label>
            <div className={`grid grid-cols-3 gap-3 p-2 rounded ${getFieldHighlight('transport_method')}`}>
              {[
                { label: 'Own vehicle', value: 'own_vehicle' },
                { label: 'Own vehicle with driver', value: 'own_vehicle_with_driver' },
                { label: 'Cab', value: 'cab' },
                { label: 'Auto', value: 'auto' },
                { label: 'Bus/Other public transport', value: 'bus' },
                { label: 'Walking', value: 'walking' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input 
                    type="radio" 
                    name="transport" 
                    checked={formData.transport_method === option.value}
                    onChange={() => handleInputChange('transport_method', option.value)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Has customer mentioned competitors (Motherhood, Rainbow, etc) in any capacity?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('mentioned_competitors')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="competitors" 
                  checked={formData.mentioned_competitors === true}
                  onChange={() => handleInputChange('mentioned_competitors', true)}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="competitors" 
                  checked={formData.mentioned_competitors === false}
                  onChange={() => handleInputChange('mentioned_competitors', false)}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Did customer seem interested/excited to know about Cloudnine facilities other than the package?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('interested_in_facilities')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="interested_facilities" 
                  checked={formData.interested_in_facilities === true}
                  onChange={() => handleInputChange('interested_in_facilities', true)}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="interested_facilities" 
                  checked={formData.interested_in_facilities === false}
                  onChange={() => handleInputChange('interested_in_facilities', false)}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Did customer ask to consult with a specific doctor or were they fine with anyone?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('doctor_preference')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="doctor_preference" 
                  checked={formData.doctor_preference === 'specific_doctor'}
                  onChange={() => handleInputChange('doctor_preference', 'specific_doctor')}
                  className="mr-2" 
                />
                <span className="text-sm">Asked for specific doctor</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="doctor_preference" 
                  checked={formData.doctor_preference === 'fine_with_anyone'}
                  onChange={() => handleInputChange('doctor_preference', 'fine_with_anyone')}
                  className="mr-2" 
                />
                <span className="text-sm">Fine with anyone</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor Name
            </label>
            <input
              type="text"
              placeholder="Enter doctor name"
              value={formData.doctor_name || ''}
              onChange={(e) => handleInputChange('doctor_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${getFieldHighlight('doctor_name')}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Did customer inquire about lowering the price or ask for additional discounts?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('price_inquiry')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="price_inquiry" 
                  checked={formData.price_inquiry === true}
                  onChange={() => handleInputChange('price_inquiry', true)}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="price_inquiry" 
                  checked={formData.price_inquiry === false}
                  onChange={() => handleInputChange('price_inquiry', false)}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who else is the customer accompanied by any other than spouse during visits to the hospital?
            </label>
            <div className={`grid grid-cols-2 gap-3 p-2 rounded ${getFieldHighlight('accompanied_by')}`}>
              {[
                { label: 'Parents', value: 'parents' },
                { label: 'Siblings', value: 'siblings' },
                { label: 'Friends', value: 'friends' },
                { label: 'No one', value: 'no_one' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input 
                    type="radio" 
                    name="accompanied_by" 
                    checked={formData.accompanied_by === option.value}
                    onChange={() => handleInputChange('accompanied_by', option.value)}
                    className="mr-2" 
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Does customer bring their other children during their visits?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('brings_other_children')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="brings_children" 
                  checked={formData.brings_other_children === 'no_other_children'}
                  onChange={() => handleInputChange('brings_other_children', 'no_other_children')}
                  className="mr-2" 
                />
                <span className="text-sm">Customer doesn't have other children</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="brings_children" 
                  checked={formData.brings_other_children === 'no'}
                  onChange={() => handleInputChange('brings_other_children', 'no')}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="brings_children" 
                  checked={formData.brings_other_children === 'yes'}
                  onChange={() => handleInputChange('brings_other_children', 'yes')}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Did the doctor remark about the customer asking lot of questions or referring to online sources?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('doctor_remark_questions')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="doctor_remark" 
                  checked={formData.doctor_remark_questions === true}
                  onChange={() => handleInputChange('doctor_remark_questions', true)}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="doctor_remark" 
                  checked={formData.doctor_remark_questions === false}
                  onChange={() => handleInputChange('doctor_remark_questions', false)}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Has customer mentioned possibility of going to native place to deliver?
            </label>
            <div className={`flex space-x-4 p-2 rounded ${getFieldHighlight('going_to_native')}`}>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="going_native" 
                  checked={formData.going_to_native === true}
                  onChange={() => handleInputChange('going_to_native', true)}
                  className="mr-2" 
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="going_native" 
                  checked={formData.going_to_native === false}
                  onChange={() => handleInputChange('going_to_native', false)}
                  className="mr-2" 
                />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Insights */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Additional Insights</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Interest
          </label>
          <input
            type="text"
            placeholder="Enter package interest"
            value={formData.package_interest || ''}
            onChange={(e) => handleInputChange('package_interest', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${getFieldHighlight('package_interest')}`}
          />
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-lg font-semibold text-purple-700 mb-4">Notes</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter note here...
          </label>
          <textarea
            rows={4}
            placeholder="Enter note here..."
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${getFieldHighlight('notes')}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: This will be saved with the patient details. For conversation notes, use the CCE Notes tab.
          </p>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button 
          onClick={() => setFormData({})}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving || Object.keys(formData).length === 0}
          className={`px-6 py-2 rounded-lg font-medium ${
            isSaving || Object.keys(formData).length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Details'}
        </button>
      </div>
    </div>
  );
};

CustomerDetailsForm.propTypes = {
  patientData: PropTypes.object,
  extractedInfo: PropTypes.object
};

export default CustomerDetailsForm;