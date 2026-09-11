import React, { useState, useEffect, useRef } from 'react';
import { 
  Keyboard, 
  Languages, 
  Percent, 
  CalendarDays, 
  Type, 
  AlignLeft, 
  Copy, 
  Check, 
  RotateCcw, 
  Printer, 
  Award,
  Download
} from 'lucide-react';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

interface ToolProps {
  onClose?: () => void;
}

// -------------------------------------------------------------
// #029: English Typing Speed Test (1-Minute WPM)
// -------------------------------------------------------------
export const TypingSpeedTestTool: React.FC<ToolProps> = () => {
  const sampleParagraph =
    'Government job recruitment in India requires candidates to possess good computer literacy and typing speed. Accuracy in typing ensures that documents, official notifications, and public records are filed without errors. Practice daily to achieve high speed and accuracy.';

  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [candidateName, setCandidateName] = useState('STUDENT');
  const timerRef = useRef<any>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(timerRef.current);
      setIsActive(false);
      setIsFinished(true);
      calculateStats();
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isActive && !isFinished) {
      setIsActive(true);
    }
    setInput(e.target.value);
  };

  const calculateStats = () => {
    const words = input.trim().split(/\s+/).filter(Boolean).length;
    const finalWpm = Math.round((words / (60 - timeLeft || 60)) * 60);
    setWpm(finalWpm);

    // Calculate accuracy
    let correct = 0;
    const minLen = Math.min(input.length, sampleParagraph.length);
    for (let i = 0; i < minLen; i++) {
      if (input[i] === sampleParagraph[i]) correct++;
    }
    const acc = minLen > 0 ? Math.round((correct / minLen) * 100) : 100;
    setAccuracy(acc);
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setInput('');
    setTimeLeft(60);
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
  };

  const printCertificate = () => {
    triggerDirectLink();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Typing Speed Certificate</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; background: #f8fafc; }
              .cert { border: 10px double #0284c7; padding: 40px; background: #fff; width: 650px; text-align: center; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              h1 { color: #0369a1; font-size: 28px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
              .sub { color: #64748b; font-size: 14px; margin-bottom: 25px; }
              .name { font-size: 24px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #0284c7; display: inline-block; padding: 0 30px 5px; margin: 15px 0; }
              .score { display: flex; justify-content: space-around; margin: 30px 0; }
              .stat { font-size: 20px; font-weight: bold; color: #0284c7; }
              .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
              .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="cert">
              <h1>Certificate of Typing Speed</h1>
              <div class="sub">999tools Skill Assessment Portal</div>
              <div>This is to certify that</div>
              <div class="name">${candidateName}</div>
              <div>has completed the official 1-minute computer typing speed assessment with:</div>
              <div class="score">
                <div><div class="stat">${wpm} WPM</div><div class="label">Gross Speed</div></div>
                <div><div class="stat">${accuracy}%</div><div class="label">Accuracy</div></div>
                <div><div class="stat">60 Sec</div><div class="label">Duration</div></div>
              </div>
              <div class="footer">
                <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
                <div>Authorized Verification Stamp</div>
              </div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #029
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            English Typing Speed Test (1-Minute Exam Simulation)
          </h2>
          <p className="text-xs text-slate-500">
            Practice for Court Clerk, SSC, Railway, and Postal Assistant typing tests with instant printable certificate.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-4 max-w-xl mx-auto">
        {/* Timer Bar */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Time Remaining:</span>
            <span className={`text-xl font-black ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-blue-600'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500">Speed:</span>{' '}
              <strong className="text-emerald-700 text-base">{wpm} WPM</strong>
            </div>
            <div>
              <span className="text-slate-500">Accuracy:</span>{' '}
              <strong className="text-blue-700 text-base">{accuracy}%</strong>
            </div>
          </div>
        </div>

        {/* Text Prompt */}
        <div className="p-4 bg-white rounded-xl border border-slate-300 font-serif text-sm leading-relaxed text-slate-800 select-none">
          {sampleParagraph}
        </div>

        {/* Typing Input */}
        <div>
          <textarea
            rows={4}
            disabled={isFinished}
            value={input}
            onChange={handleInputChange}
            placeholder={
              isFinished
                ? 'Test finished! Click Reset to try again.'
                : 'Start typing the paragraph above here... Timer will begin automatically!'
            }
            className="w-full p-3 font-mono text-sm border-2 border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Test</span>
          </button>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value.toUpperCase())}
              placeholder="Candidate Name for Certificate"
              className="flex-1 px-3 py-1.5 border rounded-xl font-bold uppercase"
            />
            <button
              onClick={printCertificate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #030: English to Hindi Typing Helper (Unicode)
// -------------------------------------------------------------
export const HindiTransliterationTool: React.FC<ToolProps> = () => {
  const [englishText, setEnglishText] = useState('Mera naam Ramesh Kumar hai.');
  const [hindiText, setHindiText] = useState('मेरा नाम रमेश कुमार है।');
  const [copied, setCopied] = useState(false);
  const { triggerDirectLink } = useAdsterraDirectLink();

  // Basic transliteration dictionary for common cyber cafe form words
  const dict: Record<string, string> = {
    mera: 'मेरा',
    naam: 'नाम',
    pita: 'पिता',
    mata: 'माता',
    shri: 'श्री',
    shrimati: 'श्रीमती',
    kumar: 'कुमार',
    singh: 'सिंह',
    sharma: 'शर्मा',
    yadav: 'यादव',
    patel: 'पटेल',
    gram: 'ग्राम',
    post: 'पोस्ट',
    jila: 'जिला',
    tahsil: 'तहसील',
    thana: 'थाना',
    pradesh: 'प्रदेश',
    uttar: 'उत्तर',
    bihar: 'बिहार',
    delhi: 'दिल्ली',
    hai: 'है',
    ka: 'का',
    ki: 'की',
    ke: 'के',
    aur: 'और',
  };

  const handleTransliterate = (val: string) => {
    setEnglishText(val);
    const words = val.split(' ');
    const converted = words
      .map((w) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        return dict[clean] || w;
      })
      .join(' ');
    setHindiText(converted);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #030
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            English to Hindi Typing Helper (Unicode / Mangal)
          </h2>
          <p className="text-xs text-slate-500">
            Type candidate details in Roman English to get instant Hindi text for government portal boxes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-xs">
        <div className="space-y-2">
          <label className="font-bold text-slate-700 block">Type in Roman English:</label>
          <textarea
            rows={5}
            value={englishText}
            onChange={(e) => handleTransliterate(e.target.value)}
            placeholder="Type e.g. pita ka naam Shri Ramesh Kumar Singh"
            className="w-full p-3 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-700">Hindi Unicode Output (Mangal):</label>
            <button
              onClick={() => {
                triggerDirectLink();
                navigator.clipboard.writeText(hindiText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-md flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Hindi'}</span>
            </button>
          </div>
          <textarea
            rows={5}
            value={hindiText}
            onChange={(e) => setHindiText(e.target.value)}
            className="w-full p-3 border rounded-xl font-semibold bg-slate-50 focus:bg-white text-base"
          />
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #031: CGPA to Percentage & Percentage to CGPA
// -------------------------------------------------------------
export const CgpaPercentageCalcTool: React.FC<ToolProps> = () => {
  const [cgpa, setCgpa] = useState<number>(8.4);
  const [cbsePercent, setCbsePercent] = useState<number>(79.8);
  const [percentInput, setPercentInput] = useState<number>(75);
  const [calculatedCgpa, setCalculatedCgpa] = useState<number>(7.89);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #031
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Percentage to CGPA & CGPA to Percentage Calculator
          </h2>
          <p className="text-xs text-slate-500">
            Official CBSE multiplier (x 9.5) and University Grade Conversion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto text-xs">
        {/* CGPA to % */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-900">Convert CGPA to Percentage (%)</h3>
          <div>
            <label className="text-slate-600 block mb-1">Enter CGPA (Scale 10):</label>
            <input
              type="number"
              step="0.01"
              value={cgpa}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setCgpa(val);
                setCbsePercent(Math.round(val * 9.5 * 100) / 100);
              }}
              className="w-full px-3 py-2 border rounded-lg font-bold text-base"
            />
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
            <span className="text-[11px] block">Formula: CGPA × 9.5</span>
            <span className="text-lg font-black">{cbsePercent}%</span>
          </div>
        </div>

        {/* % to CGPA */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-900">Convert Percentage (%) to CGPA</h3>
          <div>
            <label className="text-slate-600 block mb-1">Enter Percentage (%):</label>
            <input
              type="number"
              step="0.01"
              value={percentInput}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setPercentInput(val);
                setCalculatedCgpa(Math.round((val / 9.5) * 100) / 100);
              }}
              className="w-full px-3 py-2 border rounded-lg font-bold text-base"
            />
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
            <span className="text-[11px] block">Formula: Percentage ÷ 9.5</span>
            <span className="text-lg font-black">{calculatedCgpa} CGPA</span>
          </div>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #032: Date Difference & Days Calculator
// -------------------------------------------------------------
export const DateDifferenceCalcTool: React.FC<ToolProps> = () => {
  const [d1, setD1] = useState('2026-01-01');
  const [d2, setD2] = useState('2026-09-11');
  const [diffDays, setDiffDays] = useState(253);

  useEffect(() => {
    const time1 = new Date(d1).getTime();
    const time2 = new Date(d2).getTime();
    const diff = Math.abs(time2 - time1);
    setDiffDays(Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [d1, d2]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #032
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Date Difference & Notice Period Calculator
          </h2>
          <p className="text-xs text-slate-500">Calculate exact total days between two calendar dates.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Start Date:</label>
            <input
              type="date"
              value={d1}
              onChange={(e) => setD1(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">End Date:</label>
            <input
              type="date"
              value={d2}
              onChange={(e) => setD2(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border text-center space-y-1">
          <span className="text-xs text-slate-500 font-bold">Total Difference:</span>
          <div className="text-2xl font-black text-blue-700">{diffDays} Days</div>
          <span className="text-[11px] text-slate-500 block">
            ({Math.floor(diffDays / 30)} Months and {diffDays % 30} Days)
          </span>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #033: Text Case Converter
// -------------------------------------------------------------
export const CaseConverterTool: React.FC<ToolProps> = () => {
  const [text, setText] = useState('ramesh kumar s/o suresh kumar');
  const [copied, setCopied] = useState(false);
  const { triggerDirectLink } = useAdsterraDirectLink();

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const toSentenceCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #033
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Text Case Converter (UPPERCASE, Title Case, etc.)
          </h2>
          <p className="text-xs text-slate-500">
            Convert customer name, address, and father's name into mandatory ALL CAPS for PAN & Passport forms.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type messy customer text here..."
          className="w-full p-3 border rounded-xl font-medium"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setText(text.toUpperCase())}
            className="py-2 bg-white border border-slate-300 font-bold rounded-lg hover:bg-slate-100"
          >
            UPPERCASE
          </button>
          <button
            onClick={() => setText(text.toLowerCase())}
            className="py-2 bg-white border border-slate-300 font-bold rounded-lg hover:bg-slate-100"
          >
            lowercase
          </button>
          <button
            onClick={() => setText(toTitleCase(text))}
            className="py-2 bg-white border border-slate-300 font-bold rounded-lg hover:bg-slate-100"
          >
            Title Case
          </button>
          <button
            onClick={() => setText(toSentenceCase(text))}
            className="py-2 bg-white border border-slate-300 font-bold rounded-lg hover:bg-slate-100"
          >
            Sentence case
          </button>
        </div>

        <button
          onClick={() => {
            triggerDirectLink();
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Converted Text'}</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #034: Word, Character & Form Limit Counter
// -------------------------------------------------------------
export const WordCharCounterTool: React.FC<ToolProps> = () => {
  const [text, setText] = useState('');
  const [maxLimit, setMaxLimit] = useState(500);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text ? text.split('\n').length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #034
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Word, Character & Form Limit Counter
          </h2>
          <p className="text-xs text-slate-500">Live limit validator for UPSC, SSC, and state application forms.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-white border rounded-xl">
            <span className="text-slate-500 block">Characters:</span>
            <span
              className={`text-xl font-black ${
                charCount > maxLimit ? 'text-rose-600 font-black animate-pulse' : 'text-slate-900'
              }`}
            >
              {charCount} / {maxLimit}
            </span>
          </div>
          <div className="p-3 bg-white border rounded-xl">
            <span className="text-slate-500 block">Words:</span>
            <span className="text-xl font-black text-blue-600">{wordCount}</span>
          </div>
          <div className="p-3 bg-white border rounded-xl">
            <span className="text-slate-500 block">Lines:</span>
            <span className="text-xl font-black text-slate-700">{lineCount}</span>
          </div>
        </div>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text to validate characters..."
          className="w-full p-3 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-semibold">Form Character Limit:</span>
          {[200, 250, 500, 1000].map((lim) => (
            <button
              key={lim}
              onClick={() => setMaxLimit(lim)}
              className={`px-2 py-1 rounded font-bold border ${
                maxLimit === lim ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {lim}
            </button>
          ))}
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};
