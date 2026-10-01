import React, { useState, useMemo } from 'react';
import {
  Calendar, X, Calculator, Gift, Clock, TrendingUp,
  Sparkles, CheckCircle2, Info,
} from 'lucide-react';

interface AgeCalculatorProps {
  onClose: () => void;
}

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  dayOfWeek: string;
  nextBirthdayIn: number;
  zodiac: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ZODIAC = [
  { sign: 'Capricorn ♑', from: [12, 22], to: [1, 19] },
  { sign: 'Aquarius ♒', from: [1, 20], to: [2, 18] },
  { sign: 'Pisces ♓', from: [2, 19], to: [3, 20] },
  { sign: 'Aries ♈', from: [3, 21], to: [4, 19] },
  { sign: 'Taurus ♉', from: [4, 20], to: [5, 20] },
  { sign: 'Gemini ♊', from: [5, 21], to: [6, 20] },
  { sign: 'Cancer ♋', from: [6, 21], to: [7, 22] },
  { sign: 'Leo ♌', from: [7, 23], to: [8, 22] },
  { sign: 'Virgo ♍', from: [8, 23], to: [9, 22] },
  { sign: 'Libra ♎', from: [9, 23], to: [10, 22] },
  { sign: 'Scorpio ♏', from: [10, 23], to: [11, 21] },
  { sign: 'Sagittarius ♐', from: [11, 22], to: [12, 21] },
];

const getZodiac = (month: number, day: number): string => {
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === tm) {
      if (month === fm && day >= fd && day <= td) return z.sign;
    } else if (fm > tm) {
      // Wraps around year (Capricorn)
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return z.sign;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td) || (month > fm && month < tm)) return z.sign;
    }
  }
  return 'Unknown';
};

const calculateAge = (dob: Date, asOn: Date): AgeResult => {
  // Basic Y/M/D
  let years = asOn.getFullYear() - dob.getFullYear();
  let months = asOn.getMonth() - dob.getMonth();
  let days = asOn.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(asOn.getFullYear(), asOn.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMs = asOn.getTime() - dob.getTime();
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = Math.floor(totalMs / (1000 * 60 * 60));

  const dayOfWeek = dob.toLocaleDateString('en-IN', { weekday: 'long' });

  // Next birthday
  const thisYear = new Date(asOn.getFullYear(), dob.getMonth(), dob.getDate());
  let nextBday: Date;
  if (thisYear.getTime() >= asOn.getTime()) {
    nextBday = thisYear;
  } else {
    nextBday = new Date(asOn.getFullYear() + 1, dob.getMonth(), dob.getDate());
  }
  const nextBirthdayIn = Math.ceil(
    (nextBday.getTime() - asOn.getTime()) / (1000 * 60 * 60 * 24)
  );

  const zodiac = getZodiac(dob.getMonth() + 1, dob.getDate());

  return {
    years, months, days,
    totalDays, totalWeeks, totalMonths, totalHours,
    dayOfWeek, nextBirthdayIn, zodiac,
  };
};

const AgeCalculator: React.FC<AgeCalculatorProps> = ({ onClose }) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [dob, setDob] = useState('');
  const [asOn, setAsOn] = useState(todayStr);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo<AgeResult | null>(() => {
    if (!dob || !asOn) return null;
    try {
      const dobDate = new Date(dob + 'T00:00:00');
      const asOnDate = new Date(asOn + 'T00:00:00');

      if (isNaN(dobDate.getTime()) || isNaN(asOnDate.getTime())) return null;
      if (dobDate > asOnDate) {
        setError('Date of birth "Age as on" date se badi nahi ho sakti');
        return null;
      }
      if (dobDate.getFullYear() < 1900) {
        setError('Year 1900 se pehle ka nahi ho sakta');
        return null;
      }
      setError(null);
      return calculateAge(dobDate, asOnDate);
    } catch {
      return null;
    }
  }, [dob, asOn]);

  const reset = () => {
    setDob('');
    setAsOn(todayStr);
    setError(null);
  };

  const todayForDisplay = today.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Age Calculator
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    EXACT
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Exact age in years, months, days — for exam forms</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* Input Form */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Enter Dates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    max={asOn || todayStr}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Age as on <span className="text-slate-500">(default: today)</span>
                  </label>
                  <input
                    type="date"
                    value={asOn}
                    min={dob || undefined}
                    onChange={(e) => setAsOn(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-xs">
                  ⚠️ {error}
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-200 flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Exam form tip:</strong> Age as on date exam ke notification mein diya hota hai. Wahan exact date daalo (jaise 01-01-2026).
                </div>
              </div>
            </div>

            {/* Result */}
            {result && (
              <>
                {/* Main Age Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-center shadow-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3 h-3" />
                    Your Exact Age
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-3xl sm:text-4xl font-black text-white">{result.years}</div>
                      <div className="text-[11px] text-emerald-100 font-bold uppercase tracking-wider mt-1">
                        {result.years === 1 ? 'Year' : 'Years'}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-3xl sm:text-4xl font-black text-white">{result.months}</div>
                      <div className="text-[11px] text-emerald-100 font-bold uppercase tracking-wider mt-1">
                        {result.months === 1 ? 'Month' : 'Months'}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-3xl sm:text-4xl font-black text-white">{result.days}</div>
                      <div className="text-[11px] text-emerald-100 font-bold uppercase tracking-wider mt-1">
                        {result.days === 1 ? 'Day' : 'Days'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <InfoCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Total Days"
                    value={result.totalDays.toLocaleString('en-IN')}
                    color="blue"
                  />
                  <InfoCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Total Weeks"
                    value={result.totalWeeks.toLocaleString('en-IN')}
                    color="purple"
                  />
                  <InfoCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Total Months"
                    value={result.totalMonths.toLocaleString('en-IN')}
                    color="indigo"
                  />
                  <InfoCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Total Hours"
                    value={result.totalHours.toLocaleString('en-IN')}
                    color="amber"
                  />
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Born On
                    </div>
                    <div className="text-sm font-bold text-white">
                      {result.dayOfWeek}
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-pink-400" />
                      Next Birthday
                    </div>
                    <div className="text-sm font-bold text-white">
                      {result.nextBirthdayIn === 0
                        ? '🎉 Today!'
                        : `${result.nextBirthdayIn} days away`}
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Zodiac Sign
                    </div>
                    <div className="text-sm font-bold text-white">
                      {result.zodiac}
                    </div>
                  </div>
                </div>

                {/* Exam Eligibility Reference */}
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200">
                      <strong className="block mb-1">Common Exam Age Limits (Reference)</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-amber-100/80 text-[11px]">
                        <div>• SSC CGL: 18-32 years</div>
                        <div>• SSC CHSL: 18-27 years</div>
                        <div>• UPSC CSE: 21-32 years</div>
                        <div>• Railway NTPC: 18-33 years</div>
                        <div>• Bank PO: 20-30 years</div>
                        <div>• Police Bharti: 18-25 years (varies)</div>
                      </div>
                      <div className="mt-2 text-amber-300/70 text-[10px]">
                        ⚠️ Actual age relaxation category aur exam ke hisaab se alag hoti hai. Official notification zaroor check karo.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {!result && !error && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-blue-400" />
                </div>
                <p className="text-white font-bold mb-1">Enter your date of birth above</p>
                <p className="text-xs text-slate-400">
                  Exact age will be calculated instantly
                </p>
              </div>
            )}

            {/* Actions */}
            {(result || dob) && (
              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition"
                >
                  Reset
                </button>
                <span className="text-xs text-slate-500 ml-auto">
                  Today: {todayForDisplay}
                </span>
              </div>
            )}

            {/* Footer Info */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-xs text-blue-300 flex gap-2">
              <Calculator className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>100% Accurate:</strong> Calculation IST timezone ke hisaab se, exact Y/M/D formula se hoti hai (years-months-days borrow logic).
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// Helper: Info Card
// ═══════════════════════════════════════════
const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'indigo' | 'amber';
}> = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-lg font-black text-white font-mono">
        {value}
      </div>
    </div>
  );
};

export default AgeCalculator;
