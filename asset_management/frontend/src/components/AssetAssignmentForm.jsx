import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X } from 'lucide-react';

const AssetAssignmentForm = ({ asset, employees, onClose, onRefresh }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/assignments/assign', {
        asset_id: asset.id,
        employee_id: Number(employeeId),
        return_due_date: dueDate,
        notes: notes
      });
      onRefresh();
      onClose();
    } catch (error) {
      // Error handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Assign Asset: {asset.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Employee</label>
            <select
              className="w-full mt-1 border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Choose an employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Return Due Date</label>
            <input
              type="date"
              className="w-full mt-1 border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="w-full mt-1 border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Confirm Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssetAssignmentForm;
