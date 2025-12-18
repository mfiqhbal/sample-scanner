'use client';

import { useState, useEffect } from 'react';
import { ParsedSampleData, SampleData } from '@/types';
import toast from 'react-hot-toast';

interface SampleDataFormProps {
  initialData: ParsedSampleData;
  onSave: (data: SampleData) => Promise<void>;
  onReset: () => void;
}

export function SampleDataForm({ initialData, onSave, onReset }: SampleDataFormProps) {
  const [formData, setFormData] = useState({
    well: initialData.well,
    company: initialData.company,
    depthFrom: initialData.depthFrom?.toString() || '',
    depthTo: initialData.depthTo?.toString() || '',
    boxCode: initialData.boxCode,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      well: initialData.well,
      company: initialData.company,
      depthFrom: initialData.depthFrom?.toString() || '',
      depthTo: initialData.depthTo?.toString() || '',
      boxCode: initialData.boxCode,
    });
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.well.trim()) {
      toast.error('Well name is required');
      return;
    }
    if (!formData.depthFrom || !formData.depthTo) {
      toast.error('Depth range is required');
      return;
    }

    const depthFrom = parseFloat(formData.depthFrom);
    const depthTo = parseFloat(formData.depthTo);

    if (isNaN(depthFrom) || isNaN(depthTo)) {
      toast.error('Invalid depth values');
      return;
    }

    if (depthFrom > depthTo) {
      toast.error('Depth From must be less than Depth To');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        well: formData.well.trim(),
        company: formData.company.trim(),
        depthFrom,
        depthTo,
        boxCode: formData.boxCode.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Well Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Well Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.well}
          onChange={(e) => handleChange('well', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
          placeholder="e.g., ABC-123"
        />
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Company
        </label>
        <input
          type="text"
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
          placeholder="e.g., XYZ Corp"
        />
      </div>

      {/* Depth Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Depth From <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.depthFrom}
            onChange={(e) => handleChange('depthFrom', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
            placeholder="e.g., 2480"
            step="any"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Depth To <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.depthTo}
            onChange={(e) => handleChange('depthTo', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
            placeholder="e.g., 2490"
            step="any"
          />
        </div>
      </div>

      {/* Box Code */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Box Code
        </label>
        <input
          type="text"
          value={formData.boxCode}
          onChange={(e) => handleChange('boxCode', e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
          placeholder="e.g., 001.02.003"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isSaving}
          className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Scan Again
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save to Sheet'
          )}
        </button>
      </div>
    </form>
  );
}
