import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, X, Download, Upload, Plus, Trash2, Eye, Printer,
  User, GraduationCap, Briefcase, Sparkles, Palette, Heart,
  Phone, Mail, MapPin, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { shouldShowAdsToUser } from '../../common/AdsterraBanner';
import DownloadAdModal from '../../common/DownloadAdModal';
import ToolSidebarAd from '../../common/ToolSidebarAd';

interface ResumeMakerProps {
  onClose: () => void;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  percentage: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface ResumeData {
  // Personal
  fullName: string;
  fatherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  address: string;
  photoUrl: string | null;

  // Bio-Data specific
  timeOfBirth: string;
  placeOfBirth: string;
  height: string;
  weight: string;
  complexion: string;
  religion: string;
  caste: string;
  subCaste: string;
  gotra: string;
  maritalStatus: string;
  brothers: string;
  sisters: string;
  aboutFamily: string;

  // Professional
  objective: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  languages: string[];
  hobbies: string[];
  references: string;
}

type TemplateType = 'classic' | 'modern' | 'biodata';

const TEMPLATES: { id: TemplateType; name: string; desc: string; color: string }[] = [
  { id: 'classic', name: 'Classic Professional', desc: 'Single column, ATS-friendly', color: 'blue' },
  { id: 'modern', name: 'Modern Two-Column', desc: 'Sidebar + main content', color: 'purple' },
  { id: 'biodata', name: 'Indian Bio-Data', desc: 'Traditional marriage format', color: 'pink' },
];

const emptyEducation = (): Education => ({
  id: `edu_${Date.now()}_${Math.random()}`,
  degree: '',
  institution: '',
  year: '',
  percentage: '',
});

const emptyExperience = (): Experience => ({
  id: `exp_${Date.now()}_${Math.random()}`,
  company: '',
  role: '',
  duration: '',
  description: '',
});

const initialData: ResumeData = {
  fullName: '',
  fatherName: '',
  dob: '',
  gender: '',
  mobile: '',
  email: '',
  address: '',
  photoUrl: null,
  timeOfBirth: '',
  placeOfBirth: '',
  height: '',
  weight: '',
  complexion: '',
  religion: '',
  caste: '',
  subCaste: '',
  gotra: '',
  maritalStatus: '',
  brothers: '',
  sisters: '',
  aboutFamily: '',
  objective: '',
  education: [emptyEducation()],
  experience: [],
  skills: [],
  languages: [],
  hobbies: [],
  references: '',
};

const demoData: ResumeData = {
  fullName: 'Pankaj Das',
  fatherName: 'Ramesh Das',
  dob: '1995-06-15',
  gender: 'Male',
  mobile: '9876543210',
  email: 'pankaj@example.com',
  address: '123, MG Road, Kolkata, West Bengal - 700001',
  photoUrl: null,
  timeOfBirth: '10:30 AM',
  placeOfBirth: 'Kolkata',
  height: "5'8\"",
  weight: '70 kg',
  complexion: 'Fair',
  religion: 'Hindu',
  caste: 'General',
  subCaste: '',
  gotra: '',
  maritalStatus: 'Single',
  brothers: '1',
  sisters: '1',
  aboutFamily: 'Father is a retired government officer. Mother is a homemaker. Family is well-respected in the community.',
  objective: 'To work in a challenging environment where I can utilize my skills and contribute to organizational growth while continuously learning and developing professionally.',
  education: [
    { id: 'e1', degree: 'B.Tech in Computer Science', institution: 'IIT Delhi', year: '2017', percentage: '8.5 CGPA' },
    { id: 'e2', degree: '12th (Science)', institution: 'Kendriya Vidyalaya', year: '2013', percentage: '92%' },
    { id: 'e3', degree: '10th', institution: 'Kendriya Vidyalaya', year: '2011', percentage: '95%' },
  ],
  experience: [
    { id: 'x1', company: 'Tech Solutions Pvt Ltd', role: 'Software Developer', duration: '2018-2022', description: 'Developed and maintained web applications using React and Node.js. Led a team of 3 developers for a major client project.' },
    { id: 'x2', company: 'StartupXYZ', role: 'Junior Developer', duration: '2017-2018', description: 'Built responsive UIs and integrated REST APIs.' },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB', 'Git', 'Problem Solving'],
  languages: ['Hindi', 'English', 'Bengali'],
  hobbies: ['Reading', 'Coding', 'Cricket', 'Photography'],
  references: 'Available upon request',
};

const ResumeMaker: React.FC<ResumeMakerProps> = ({ onClose }) => {
  const { currentUser, isUserPremium, activeVle, ownerAuthenticated } = useApp();
  const [data, setData] = useState<ResumeData>(initialData);
  const [template, setTemplate] = useState<TemplateType>('classic');
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [hobbyInput, setHobbyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingDownload, setPendingDownload] = useState<{ label: string; action: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const isPaidUser = !shouldShowAdsToUser(
    ownerAuthenticated,
    currentUser,
    isUserPremium,
    activeVle
  );

  const requestDownload = (label: string, action: () => void) => {
    if (isPaidUser) { action(); return; }
    setPendingDownload({ label, action });
  };

  const handleAdComplete = () => {
    const action = pendingDownload?.action;
    setPendingDownload(null);
    action?.();
  };

  const updateField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      updateField('photoUrl', e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addEducation = () => {
    updateField('education', [...data.education, emptyEducation()]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    updateField(
      'education',
      data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const removeEducation = (id: string) => {
    if (data.education.length <= 1) return;
    updateField('education', data.education.filter((e) => e.id !== id));
  };

  const addExperience = () => {
    updateField('experience', [...data.experience, emptyExperience()]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    updateField(
      'experience',
      data.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const removeExperience = (id: string) => {
    updateField('experience', data.experience.filter((e) => e.id !== id));
  };

  const addTag = (field: 'skills' | 'languages' | 'hobbies', value: string, resetFn: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (data[field].includes(trimmed)) return;
    updateField(field, [...data[field], trimmed]);
    resetFn();
  };

  const removeTag = (field: 'skills' | 'languages' | 'hobbies', value: string) => {
    updateField(field, data[field].filter((v) => v !== value));
  };

  const loadDemo = () => {
    setData(demoData);
    setError(null);
  };

  const resetAll = () => {
    setData(initialData);
    setError(null);
  };

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'objective', label: 'Objective', icon: Sparkles },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'skills', label: 'Skills & Tags', icon: Palette },
    { id: 'biodata', label: 'Bio-Data Extra', icon: Heart },
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? '' : id);
  };

  // ============================================
  // TEMPLATE RENDERERS
  // ============================================

  const renderClassicTemplate = () => (
    <div className="bg-white text-slate-900 p-8" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
        {data.photoUrl && (
          <img src={data.photoUrl} alt="profile" className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-slate-800" />
        )}
        <h1 className="text-3xl font-bold tracking-wide uppercase text-slate-900">
          {data.fullName || 'YOUR NAME'}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-700">
          {data.mobile && <span>📱 {data.mobile}</span>}
          {data.email && <span>✉️ {data.email}</span>}
          {data.address && <span>📍 {data.address}</span>}
        </div>
      </div>

      {/* Objective */}
      {data.objective && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
            Career Objective
          </h2>
          <p className="text-xs leading-relaxed text-slate-700">{data.objective}</p>
        </section>
      )}

      {/* Education */}
      {data.education.some((e) => e.degree || e.institution) && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
            Education
          </h2>
          <div className="space-y-2">
            {data.education.filter((e) => e.degree || e.institution).map((e) => (
              <div key={e.id} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{e.degree}</span>
                  <span className="text-slate-600 text-[11px]">{e.year}</span>
                </div>
                <div className="flex justify-between text-slate-700 mt-0.5">
                  <span>{e.institution}</span>
                  <span className="font-semibold">{e.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {data.experience.some((e) => e.company || e.role) && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
            Work Experience
          </h2>
          <div className="space-y-3">
            {data.experience.filter((e) => e.company || e.role).map((e) => (
              <div key={e.id} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{e.role}</span>
                  <span className="text-slate-600 text-[11px]">{e.duration}</span>
                </div>
                <div className="text-slate-700 italic text-[11px] mt-0.5">{e.company}</div>
                {e.description && <p className="text-slate-700 mt-1 leading-relaxed">{e.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
            Skills
          </h2>
          <div className="text-xs text-slate-700">
            {data.skills.join(' • ')}
          </div>
        </section>
      )}

      {/* Languages & Hobbies */}
      <div className="grid grid-cols-2 gap-4">
        {data.languages.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
              Languages
            </h2>
            <div className="text-xs text-slate-700">{data.languages.join(', ')}</div>
          </section>
        )}
        {data.hobbies.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
              Hobbies
            </h2>
            <div className="text-xs text-slate-700">{data.hobbies.join(', ')}</div>
          </section>
        )}
      </div>

      {/* References */}
      {data.references && (
        <section className="mt-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-slate-400 pb-1 mb-2 text-slate-800">
            References
          </h2>
          <p className="text-xs text-slate-700">{data.references}</p>
        </section>
      )}
    </div>
  );

  const renderModernTemplate = () => (
    <div className="bg-white text-slate-900 flex" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-800 text-white p-6">
        {data.photoUrl && (
          <img src={data.photoUrl} alt="profile" className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-white/20" />
        )}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">{data.fullName || 'YOUR NAME'}</h1>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-2">
              Contact
            </h2>
            <div className="space-y-1.5 text-slate-200">
              {data.mobile && <div>📱 {data.mobile}</div>}
              {data.email && <div className="break-all">✉️ {data.email}</div>}
              {data.address && <div>📍 {data.address}</div>}
            </div>
          </div>

          {data.skills.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-2">
                Skills
              </h2>
              <div className="space-y-1">
                {data.skills.map((s, i) => (
                  <div key={i} className="text-slate-200">• {s}</div>
                ))}
              </div>
            </div>
          )}

          {data.languages.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-2">
                Languages
              </h2>
              <div className="space-y-1">
                {data.languages.map((l, i) => (
                  <div key={i} className="text-slate-200">• {l}</div>
                ))}
              </div>
            </div>
          )}

          {data.hobbies.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-2">
                Hobbies
              </h2>
              <div className="space-y-1">
                {data.hobbies.map((h, i) => (
                  <div key={i} className="text-slate-200">• {h}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-8">
        {data.objective && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b-2 border-purple-500 pb-1 mb-2">
              Profile
            </h2>
            <p className="text-xs leading-relaxed text-slate-700">{data.objective}</p>
          </section>
        )}

        {data.education.some((e) => e.degree || e.institution) && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b-2 border-purple-500 pb-1 mb-2">
              Education
            </h2>
            <div className="space-y-2">
              {data.education.filter((e) => e.degree || e.institution).map((e) => (
                <div key={e.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">{e.degree}</span>
                    <span className="text-slate-500 text-[11px]">{e.year}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 mt-0.5">
                    <span>{e.institution}</span>
                    <span className="font-semibold">{e.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.experience.some((e) => e.company || e.role) && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b-2 border-purple-500 pb-1 mb-2">
              Experience
            </h2>
            <div className="space-y-3">
              {data.experience.filter((e) => e.company || e.role).map((e) => (
                <div key={e.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">{e.role}</span>
                    <span className="text-slate-500 text-[11px]">{e.duration}</span>
                  </div>
                  <div className="text-slate-600 italic text-[11px] mt-0.5">{e.company}</div>
                  {e.description && <p className="text-slate-700 mt-1 leading-relaxed">{e.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.references && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b-2 border-purple-500 pb-1 mb-2">
              References
            </h2>
            <p className="text-xs text-slate-700">{data.references}</p>
          </section>
        )}
      </div>
    </div>
  );

        const renderBiodataTemplate = () => (
    <div className="bg-white text-slate-900 p-8" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Georgia, serif' }}>
      {/* Decorative Border */}
      <div className="border-4 border-double border-pink-700 p-6">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-pink-700">
          <h1 className="text-3xl font-bold tracking-widest uppercase text-pink-800">
            Bio-Data
          </h1>
          <div className="text-[10px] tracking-widest text-pink-600 mt-1">
            ~ MARRIAGE PROFILE ~
          </div>
        </div>

        {/* Photo */}
        {data.photoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={data.photoUrl}
              alt="profile"
              className="w-32 h-40 object-cover border-2 border-pink-700 rounded"
            />
          </div>
        )}

        {/* Personal Details */}
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
            Personal Details
          </h2>
          <table className="w-full text-xs">
            <tbody>
              <BioRow label="Full Name" value={data.fullName} />
              <BioRow label="Date of Birth" value={data.dob} />
              <BioRow label="Time of Birth" value={data.timeOfBirth} />
              <BioRow label="Place of Birth" value={data.placeOfBirth} />
              <BioRow label="Gender" value={data.gender} />
              <BioRow label="Height" value={data.height} />
              <BioRow label="Weight" value={data.weight} />
              <BioRow label="Complexion" value={data.complexion} />
              <BioRow label="Marital Status" value={data.maritalStatus} />
            </tbody>
          </table>
        </section>

        {/* Religious Info */}
        {(data.religion || data.caste || data.subCaste || data.gotra) && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
              Religious / Community
            </h2>
            <table className="w-full text-xs">
              <tbody>
                <BioRow label="Religion" value={data.religion} />
                <BioRow label="Caste" value={data.caste} />
                <BioRow label="Sub-Caste" value={data.subCaste} />
                <BioRow label="Gotra" value={data.gotra} />
              </tbody>
            </table>
          </section>
        )}

        {/* Family */}
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
            Family Details
          </h2>
          <table className="w-full text-xs">
            <tbody>
              <BioRow label="Father's Name" value={data.fatherName} />
              <BioRow label="Brothers" value={data.brothers} />
              <BioRow label="Sisters" value={data.sisters} />
            </tbody>
          </table>
          {data.aboutFamily && (
            <div className="text-xs text-slate-700 mt-2 leading-relaxed">
              <span className="font-bold">About Family: </span>
              {data.aboutFamily}
            </div>
          )}
        </section>

        {/* Education & Occupation */}
        {data.education.some((e) => e.degree) && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
              Education
            </h2>
            <div className="space-y-1">
              {data.education.filter((e) => e.degree).map((e) => (
                <div key={e.id} className="text-xs">
                  <span className="font-bold">{e.degree}</span>
                  {e.institution && <span className="text-slate-700"> — {e.institution}</span>}
                  {e.year && <span className="text-slate-500"> ({e.year})</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.experience.some((e) => e.role) && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
              Occupation
            </h2>
            <div className="space-y-1">
              {data.experience.filter((e) => e.role).map((e) => (
                <div key={e.id} className="text-xs">
                  <span className="font-bold">{e.role}</span>
                  {e.company && <span className="text-slate-700"> at {e.company}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
            Contact Details
          </h2>
          <table className="w-full text-xs">
            <tbody>
              <BioRow label="Mobile" value={data.mobile} />
              <BioRow label="Email" value={data.email} />
              <BioRow label="Address" value={data.address} />
            </tbody>
          </table>
        </section>

        {/* Hobbies */}
        {data.hobbies.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider bg-pink-700 text-white px-3 py-1 mb-3">
              Hobbies & Interests
            </h2>
            <div className="text-xs text-slate-700">{data.hobbies.join(' • ')}</div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-pink-600 mt-8 pt-3 border-t border-pink-300">
          Generated with 999tools.store — Free Bio-Data Maker
        </div>
      </div>
    </div>
  );

  // ============================================
  // PDF GENERATION
  // ============================================

  const handleDownloadPDF = async () => {
    requestDownload(`${data.fullName || 'Resume'}.pdf`, async () => {
      try {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        if (!previewRef.current) return;

        const canvas = await html2canvas(previewRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgRatio = canvas.height / canvas.width;
        const finalHeight = pdfWidth * imgRatio;

        let heightLeft = finalHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, finalHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - finalHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, finalHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save(`${data.fullName || 'resume'}_${template}.pdf`);
      } catch (err) {
        console.error('PDF generation failed:', err);
        setError('PDF generation failed. Please try again.');
      }
    });
  };

  const handlePrint = () => {
    requestDownload('Print Preview', () => {
      if (!previewRef.current) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((el) => el.outerHTML)
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${data.fullName || 'Resume'}</title>
            ${styles}
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                @page { size: A4; margin: 0; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${previewRef.current.outerHTML}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  };

  const renderPreview = () => {
    if (template === 'classic') return renderClassicTemplate();
    if (template === 'modern') return renderModernTemplate();
    return renderBiodataTemplate();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen py-6 px-4">
          <div className="max-w-[1400px] mx-auto flex gap-4 justify-center items-start">
            <ToolSidebarAd slotKey="tool_sidebar_left" />

            <div className="w-full max-w-7xl flex-1 min-w-0 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Resume Maker
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">3 templates · Live preview · PDF download</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* LEFT — FORM */}
                <div className="space-y-3">
                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={loadDemo}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg transition border border-amber-500/40"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Load Demo
                    </button>
                    <button
                      onClick={resetAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs font-bold rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset
                    </button>
                    <span className="ml-auto text-[10px] text-slate-500">
                      {data.fullName ? `Editing: ${data.fullName}` : 'New resume'}
                    </span>
                  </div>

                  {/* Template Selector */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                    <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-purple-400" /> Choose Template
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTemplate(t.id)}
                          className={`p-3 rounded-lg border-2 transition text-left ${
                            template === t.id
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                          }`}
                        >
                          <div className={`text-sm font-bold ${template === t.id ? 'text-purple-300' : 'text-slate-300'}`}>
                            {t.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sections */}
                  {sections.map((s) => {
                    const Icon = s.icon;
                    const isOpen = activeSection === s.id;
                    return (
                      <div key={s.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <button
                          onClick={() => toggleSection(s.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900 transition"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-bold text-white">{s.label}</span>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                            {s.id === 'personal' && (
                              <>
                                <InputField label="Full Name" value={data.fullName} onChange={(v) => updateField('fullName', v)} placeholder="e.g. Pankaj Das" />
                                <InputField label="Father's Name" value={data.fatherName} onChange={(v) => updateField('fatherName', v)} />
                                <div className="grid grid-cols-2 gap-2">
                                  <InputField label="Date of Birth" value={data.dob} onChange={(v) => updateField('dob', v)} type="date" />
                                  <InputField label="Gender" value={data.gender} onChange={(v) => updateField('gender', v)} placeholder="Male/Female" />
                                </div>
                                <InputField label="Mobile" value={data.mobile} onChange={(v) => updateField('mobile', v)} placeholder="10-digit mobile" />
                                <InputField label="Email" value={data.email} onChange={(v) => updateField('email', v)} type="email" />
                                <TextAreaField label="Address" value={data.address} onChange={(v) => updateField('address', v)} rows={2} />

                                <div>
                                  <label className="text-xs font-bold text-slate-300 block mb-2">Photo (optional)</label>
                                  {data.photoUrl ? (
                                    <div className="flex items-center gap-3">
                                      <img src={data.photoUrl} alt="photo" className="w-16 h-16 rounded-lg object-cover border-2 border-slate-700" />
                                      <button
                                        onClick={() => updateField('photoUrl', null)}
                                        className="text-xs text-red-400 hover:text-red-300"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => fileInputRef.current?.click()}
                                      className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 text-xs font-bold rounded-lg transition w-full justify-center"
                                    >
                                      <Upload className="w-3.5 h-3.5" /> Upload Photo
                                    </button>
                                  )}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e.target.files)}
                                    className="hidden"
                                  />
                                </div>
                              </>
                            )}

                            {s.id === 'objective' && (
                              <TextAreaField
                                label="Career Objective / Summary"
                                value={data.objective}
                                onChange={(v) => updateField('objective', v)}
                                rows={4}
                                placeholder="2-3 lines about your career goal..."
                              />
                            )}

                            {s.id === 'education' && (
                              <>
                                {data.education.map((e, idx) => (
                                  <div key={e.id} className="bg-slate-900 rounded-lg p-3 space-y-2 border border-slate-800">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Education {idx + 1}</span>
                                      {data.education.length > 1 && (
                                        <button onClick={() => removeEducation(e.id)} className="text-red-400 hover:text-red-300">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <InputField label="Degree" value={e.degree} onChange={(v) => updateEducation(e.id, 'degree', v)} placeholder="B.Tech / 12th / 10th" />
                                    <InputField label="Institution" value={e.institution} onChange={(v) => updateEducation(e.id, 'institution', v)} />
                                    <div className="grid grid-cols-2 gap-2">
                                      <InputField label="Year" value={e.year} onChange={(v) => updateEducation(e.id, 'year', v)} placeholder="2020" />
                                      <InputField label="% / CGPA" value={e.percentage} onChange={(v) => updateEducation(e.id, 'percentage', v)} placeholder="85%" />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  onClick={addEducation}
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold rounded-lg border border-blue-500/40 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Education
                                </button>
                              </>
                            )}

                            {s.id === 'experience' && (
                              <>
                                {data.experience.length === 0 && (
                                  <p className="text-xs text-slate-500 text-center py-2">No experience added yet</p>
                                )}
                                {data.experience.map((e, idx) => (
                                  <div key={e.id} className="bg-slate-900 rounded-lg p-3 space-y-2 border border-slate-800">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Experience {idx + 1}</span>
                                      <button onClick={() => removeExperience(e.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <InputField label="Role" value={e.role} onChange={(v) => updateExperience(e.id, 'role', v)} placeholder="Software Developer" />
                                    <InputField label="Company" value={e.company} onChange={(v) => updateExperience(e.id, 'company', v)} />
                                    <InputField label="Duration" value={e.duration} onChange={(v) => updateExperience(e.id, 'duration', v)} placeholder="2020-2023" />
                                    <TextAreaField label="Description" value={e.description} onChange={(v) => updateExperience(e.id, 'description', v)} rows={2} />
                                  </div>
                                ))}
                                <button
                                  onClick={addExperience}
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold rounded-lg border border-blue-500/40 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Experience
                                </button>
                              </>
                            )}

                            {s.id === 'skills' && (
                              <>
                                <TagInput
                                  label="Skills"
                                  value={skillInput}
                                  onChange={setSkillInput}
                                  onAdd={() => addTag('skills', skillInput, () => setSkillInput(''))}
                                  tags={data.skills}
                                  onRemove={(t) => removeTag('skills', t)}
                                  placeholder="e.g. React, Photoshop"
                                />
                                <TagInput
                                  label="Languages"
                                  value={languageInput}
                                  onChange={setLanguageInput}
                                  onAdd={() => addTag('languages', languageInput, () => setLanguageInput(''))}
                                  tags={data.languages}
                                  onRemove={(t) => removeTag('languages', t)}
                                  placeholder="e.g. Hindi, English"
                                />
                                <TagInput
                                  label="Hobbies"
                                  value={hobbyInput}
                                  onChange={setHobbyInput}
                                  onAdd={() => addTag('hobbies', hobbyInput, () => setHobbyInput(''))}
                                  tags={data.hobbies}
                                  onRemove={(t) => removeTag('hobbies', t)}
                                  placeholder="e.g. Cricket, Reading"
                                />
                                <TextAreaField label="References" value={data.references} onChange={(v) => updateField('references', v)} rows={2} placeholder="Available upon request" />
                              </>
                            )}

                            {s.id === 'biodata' && (
                              <>
                                <p className="text-[10px] text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-lg p-2">
                                  💍 Ye fields sirf "Indian Bio-Data" template ke liye hain.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <InputField label="Time of Birth" value={data.timeOfBirth} onChange={(v) => updateField('timeOfBirth', v)} placeholder="10:30 AM" />
                                  <InputField label="Place of Birth" value={data.placeOfBirth} onChange={(v) => updateField('placeOfBirth', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <InputField label="Height" value={data.height} onChange={(v) => updateField('height', v)} placeholder="5'8&quot;" />
                                  <InputField label="Weight" value={data.weight} onChange={(v) => updateField('weight', v)} placeholder="70 kg" />
                                </div>
                                <InputField label="Complexion" value={data.complexion} onChange={(v) => updateField('complexion', v)} placeholder="Fair / Wheatish" />
                                <div className="grid grid-cols-2 gap-2">
                                  <InputField label="Religion" value={data.religion} onChange={(v) => updateField('religion', v)} />
                                  <InputField label="Caste" value={data.caste} onChange={(v) => updateField('caste', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <InputField label="Sub-Caste" value={data.subCaste} onChange={(v) => updateField('subCaste', v)} />
                                  <InputField label="Gotra" value={data.gotra} onChange={(v) => updateField('gotra', v)} />
                                </div>
                                <InputField label="Marital Status" value={data.maritalStatus} onChange={(v) => updateField('maritalStatus', v)} placeholder="Single / Divorced" />
                                <div className="grid grid-cols-2 gap-2">
                                  <InputField label="Brothers" value={data.brothers} onChange={(v) => updateField('brothers', v)} placeholder="1" />
                                  <InputField label="Sisters" value={data.sisters} onChange={(v) => updateField('sisters', v)} placeholder="1" />
                                </div>
                                <TextAreaField label="About Family" value={data.aboutFamily} onChange={(v) => updateField('aboutFamily', v)} rows={3} />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-xs">
                      ⚠️ {error}
                    </div>
                  )}
                </div>

                {/* RIGHT — PREVIEW */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Download
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-3 overflow-auto max-h-[80vh] border border-slate-700">
                    <div
                      ref={previewRef}
                      className="mx-auto shadow-2xl"
                      style={{ transform: 'scale(0.55)', transformOrigin: 'top center', width: '210mm' }}
                    >
                      {renderPreview()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ToolSidebarAd slotKey="tool_sidebar_right" />
          </div>
        </div>
      </div>

      {!isPaidUser && pendingDownload && (
        <DownloadAdModal
          fileName={pendingDownload.label}
          onComplete={handleAdComplete}
          onCancel={() => setPendingDownload(null)}
        />
      )}
    </>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const BioRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <tr className="border-b border-slate-200">
      <td className="py-1.5 pr-3 font-bold text-slate-700 w-1/3 align-top">{label}:</td>
      <td className="py-1.5 text-slate-800 align-top">{value}</td>
    </tr>
  );
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="text-[11px] font-bold text-slate-400 block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 outline-none"
    />
  </div>
);

const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}> = ({ label, value, onChange, rows = 3, placeholder }) => (
  <div>
    <label className="text-[11px] font-bold text-slate-400 block mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 outline-none resize-none"
    />
  </div>
);

const TagInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  tags: string[];
  onRemove: (tag: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, onAdd, tags, onRemove, placeholder }) => (
  <div>
    <label className="text-[11px] font-bold text-slate-400 block mb-1">{label}</label>
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
        placeholder={placeholder}
        className="flex-1 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 outline-none"
      />
      <button
        onClick={onAdd}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
    {tags.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-[11px] font-bold rounded-full border border-blue-500/40">
            {t}
            <button onClick={() => onRemove(t)} className="hover:text-red-300">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
);

export default ResumeMaker;

 esumeMaker;
