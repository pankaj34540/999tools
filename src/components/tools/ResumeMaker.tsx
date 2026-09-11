import React, { useState } from 'react';
import { FileText, Printer, Download, Sparkles, Plus, Trash2 } from 'lucide-react';

interface ResumeMakerProps {
  onClose?: () => void;
}

interface Qualification {
  id: string;
  exam: string;
  board: string;
  year: string;
  marks: string;
  division: string;
}

export const ResumeMaker: React.FC<ResumeMakerProps> = ({ onClose }) => {
  const [name, setName] = useState('AMIT KUMAR');
  const [fatherName, setFatherName] = useState('Shri Ramesh Kumar');
  const [motherName, setMotherName] = useState('Smt. Sunita Devi');
  const [dob, setDob] = useState('15/07/1998');
  const [gender, setGender] = useState('Male');
  const [maritalStatus, setMaritalStatus] = useState('Unmarried');
  const [nationality, setNationality] = useState('Indian');
  const [religion, setReligion] = useState('Hindu');
  const [category, setCategory] = useState('OBC');
  const [mobile, setMobile] = useState('+91 98765 43210');
  const [email, setEmail] = useState('amitkumar1998@gmail.com');
  const [address, setAddress] = useState('Vill & Post: Rampur, Dist: Lucknow, Uttar Pradesh - 226001');
  const [languages, setLanguages] = useState('Hindi & English (Read, Write & Speak)');
  const [careerObjective, setCareerObjective] = useState(
    'To secure a challenging position in an organization where I can utilize my skills, dedication, and knowledge for organizational growth while developing my career.'
  );

  const [skills, setSkills] = useState('Basic Computer (CCC Certified), MS Office, Hindi & English Typing, Internet Browsing & Data Entry');
  const [experience, setExperience] = useState('1 Year experience as Computer Operator & Customer Assistant at Jan Seva Kendra, Lucknow.');

  const [qualifications, setQualifications] = useState<Qualification[]>([
    { id: '1', exam: '10th (High School)', board: 'UP Board', year: '2014', marks: '78.5%', division: '1st' },
    { id: '2', exam: '12th (Intermediate)', board: 'UP Board', year: '2016', marks: '74.2%', division: '1st' },
    { id: '3', exam: 'B.A. (Graduation)', board: 'Lucknow University', year: '2019', marks: '65.8%', division: '1st' },
  ]);

  const addQualification = () => {
    setQualifications((prev) => [
      ...prev,
      { id: Date.now().toString(), exam: 'Course/Degree', board: 'Board/Univ', year: '2022', marks: '70%', division: '1st' },
    ]);
  };

  const removeQualification = (id: string) => {
    setQualifications((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQualification = (id: string, field: keyof Qualification, val: string) => {
    setQualifications((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: val } : q))
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="resume-maker-tool" className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Tool Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <FileText className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Cyber Cafe Bio-Data & Resume Generator</h2>
            <p className="text-xs text-indigo-200">
              Generate 100% formatted A4 bio-data for jobs, marriage, or govt form submission
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-6 p-5 bg-slate-50 border-r border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Personal Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold uppercase"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Father's Name:</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Mother's Name:</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Date of Birth:</label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Gender:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Marital Status:</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="Unmarried">Unmarried</option>
                  <option value="Married">Married</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Mobile Number:</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold">Email ID:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 font-semibold">Permanent Address:</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Educational Qualifications */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Academic Qualifications
              </h3>
              <button
                type="button"
                onClick={addQualification}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="space-y-2">
              {qualifications.map((q) => (
                <div key={q.id} className="grid grid-cols-12 gap-1.5 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    placeholder="Exam"
                    value={q.exam}
                    onChange={(e) => updateQualification(q.id, 'exam', e.target.value)}
                    className="col-span-3 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Board"
                    value={q.board}
                    onChange={(e) => updateQualification(q.id, 'board', e.target.value)}
                    className="col-span-3 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={q.year}
                    onChange={(e) => updateQualification(q.id, 'year', e.target.value)}
                    className="col-span-2 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="%"
                    value={q.marks}
                    onChange={(e) => updateQualification(q.id, 'marks', e.target.value)}
                    className="col-span-2 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeQualification(q.id)}
                    className="col-span-2 text-rose-500 hover:text-rose-700 flex justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skills & Experience */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold">Technical Skills / Certifications:</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold">Work Experience:</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold">Languages Known:</label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live A4 Print Preview (Right) */}
        <div className="lg:col-span-6 p-6 bg-slate-200 flex justify-center overflow-y-auto max-h-[85vh]">
          <div
            id="printable-resume"
            className="w-full max-w-[550px] bg-white text-slate-900 shadow-2xl p-8 border border-slate-300 font-serif leading-relaxed text-xs"
            style={{ minHeight: '750px' }}
          >
            {/* Resume Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-xl font-bold tracking-wider uppercase">{name}</h1>
              <p className="text-[11px] text-slate-700 mt-1 font-sans">{address}</p>
              <p className="text-[11px] text-slate-700 font-sans">
                Mobile: {mobile} | Email: {email}
              </p>
            </div>

            {/* Objective */}
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 border-l-4 border-slate-900 mb-1.5 font-sans">
                Career Objective
              </h2>
              <p className="text-[11px] text-justify">{careerObjective}</p>
            </div>

            {/* Academic */}
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 border-l-4 border-slate-900 mb-1.5 font-sans">
                Educational Qualification
              </h2>
              <table className="w-full border-collapse border border-slate-300 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-800">
                    <th className="border border-slate-300 p-1 text-left">Exam Passed</th>
                    <th className="border border-slate-300 p-1 text-left">Board/Univ</th>
                    <th className="border border-slate-300 p-1 text-center">Year</th>
                    <th className="border border-slate-300 p-1 text-center">Marks %</th>
                    <th className="border border-slate-300 p-1 text-center">Division</th>
                  </tr>
                </thead>
                <tbody>
                  {qualifications.map((q) => (
                    <tr key={q.id}>
                      <td className="border border-slate-300 p-1 font-semibold">{q.exam}</td>
                      <td className="border border-slate-300 p-1">{q.board}</td>
                      <td className="border border-slate-300 p-1 text-center">{q.year}</td>
                      <td className="border border-slate-300 p-1 text-center">{q.marks}</td>
                      <td className="border border-slate-300 p-1 text-center">{q.division}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Skills & Experience */}
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 border-l-4 border-slate-900 mb-1.5 font-sans">
                Technical Skills & Experience
              </h2>
              <div className="text-[11px] space-y-1">
                <p><strong>Technical Skills:</strong> {skills}</p>
                <p><strong>Experience:</strong> {experience}</p>
                <p><strong>Languages Known:</strong> {languages}</p>
              </div>
            </div>

            {/* Personal Details */}
            <div className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 border-l-4 border-slate-900 mb-1.5 font-sans">
                Personal Profile
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div><strong>Father's Name:</strong> {fatherName}</div>
                <div><strong>Mother's Name:</strong> {motherName}</div>
                <div><strong>Date of Birth:</strong> {dob}</div>
                <div><strong>Gender:</strong> {gender}</div>
                <div><strong>Marital Status:</strong> {maritalStatus}</div>
                <div><strong>Nationality:</strong> {nationality}</div>
                <div><strong>Religion:</strong> {religion}</div>
                <div><strong>Category:</strong> {category}</div>
              </div>
            </div>

            {/* Declaration */}
            <div className="pt-2 text-[10px] text-justify">
              <p>
                <strong>Declaration:</strong> I hereby declare that all the information provided above is true, complete, and correct to the best of my knowledge and belief.
              </p>
              <div className="mt-8 flex justify-between items-end font-sans">
                <div>
                  <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                  <p>Place: Lucknow</p>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <p className="font-bold">({name})</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
