import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CCENotes = ({ patientId }) => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchNotes();
    }
  }, [patientId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes?patient_id=${patientId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err.message);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!patientId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Please select a patient to view notes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">Error loading notes: {error}</p>
          <button
            onClick={fetchNotes}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2">Loading notes...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && notes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No notes available</p>
          <p className="text-sm mt-2">Add notes in the Customer Details Form to see them here</p>
        </div>
      )}

      {/* Notes List */}
      {!isLoading && !error && notes.length > 0 && (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.note_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-medium text-sm">
                      {note.created_by?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {note.created_by || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {note.created_date ? new Date(note.created_date).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date unknown'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.note_text || 'No content'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {!isLoading && notes.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={fetchNotes}
            className="px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Refresh Notes
          </button>
        </div>
      )}
    </div>
  );
};

CCENotes.propTypes = {
  patientId: PropTypes.number
};

export default CCENotes;