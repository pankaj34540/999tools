import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface AgeCalculatorProps {
  onClose?: () => void;
}

export const AgeCalculator: React.FC<AgeCalculatorProps> = ({ onClose }) => {
  const [birthDate, setBirthDate] = useState('2000-05-15');
  const [targetDate, setTargetDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Criteria validation
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(27);

  // Calculate detailed age
  const calculateAge = () => {
    if (!birthDate || !targetDate) return null;

    const b = new Date(birthDate);
    const t = new Date(targetDate);

    if (isNaN(b.getTime()) || isNaN(t.getTime()) || t < b) {
      return null;
    }

    let years = t.getFullYear() - b.getFullYear();
    let months = t.getMonth() - b.getMonth();
    let days = t.getDate() - b.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(t.getFullYear(), t.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total days
    const diffTime = Math.abs(t.getTime() - b.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    // Next Birthday countdown
    let nextBdayYear = t.getFullYear();
    let nextBday = new Date(nextBdayYear, b.getMonth(), b.getDate());
    if (nextBday < t) {
      nextBday = new Date(nextBdayYear + 1, b.getMonth(), b.getDate());
    }
    const daysToNextBday = Math.ceil((nextBday.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));

    const isEligible = years >= minAge && (years < maxAge || (years === maxAge && months === 0 && days === 0));

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      daysToNextBday,
      isEligible,
    };
  };

  const result = calculateAge();

  return (
    <div id="age-calculator-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Calendar className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Govt Exam Age & Cut-off Calculator</h2>
            <p className="text-xs text-blue-100">
              Calculate exact age in Years, Months, and Days as per official advertisement cut-off date
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
          >
            Close
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              1. Candidate Date of Birth (DOB)
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 text-base shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              2. Exam Age Cut-off Date (As on date)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 text-base shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setTargetDate('2026-01-01')}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
              >
                01/01/2026 (Common Cutoff)
              </button>
              <button
                type="button"
                onClick={() => setTargetDate('2026-07-01')}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
              >
                01/07/2026
              </button>
              <button
                type="button"
                onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
              >
                Today
              </button>
            </div>
          </div>

          {/* Eligibility Criteria check */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Exam Criteria Eligibility Check:</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500">Min Age (Years):</label>
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Max Age (Years):</label>
                <input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-center">
          {result ? (
            <div className="space-y-5">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Exact Age</span>
                <div className="mt-2 flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-extrabold text-blue-900">{result.years}</span>
                  <span className="text-sm font-semibold text-slate-600">Years</span>
                  <span className="text-4xl font-extrabold text-blue-900 ml-2">{result.months}</span>
                  <span className="text-sm font-semibold text-slate-600">Months</span>
                  <span className="text-4xl font-extrabold text-blue-900 ml-2">{result.days}</span>
                  <span className="text-sm font-semibold text-slate-600">Days</span>
                </div>
              </div>

              {/* Eligibility Badge */}
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  result.isEligible
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {result.isEligible ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-sm">
                    {result.isEligible ? 'Eligible for Examination' : 'Age Limit Criteria Exceeded / Underage'}
                  </div>
                  <span>
                    Requirement: {minAge} to {maxAge} Years. Current age: {result.years}Y {result.months}M {result.days}D.
                  </span>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Total Days</span>
                  <span className="font-bold text-slate-800 text-sm">{result.totalDays.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Total Weeks</span>
                  <span className="font-bold text-slate-800 text-sm">{result.totalWeeks.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Next Birthday</span>
                  <span className="font-bold text-indigo-700 text-sm">{result.daysToNextBday} Days</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm py-10">
              Please enter valid Birth Date and Cut-off Date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
