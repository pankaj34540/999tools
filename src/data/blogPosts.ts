// ============================================
// BLOG POSTS DATA — SEO-optimized content
// ============================================

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; title?: string; text: string }
  | { type: 'cta'; text: string; linkText: string; link: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string; // ISO date
  readTime: number;    // minutes
  bannerGradient: string; // tailwind gradient classes
  content: ContentBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  // ═══════════════════════════════════════════
  // POST 1: PAN Card
  // ═══════════════════════════════════════════
  {
    slug: 'pan-card-apply-online-2026',
    title: 'PAN Card Apply Online 2026 — Complete Step-by-Step Guide',
    excerpt:
      'PAN card apply online kaise karein 2026 mein? Ye complete guide padhein jismein documents, fees, processing time, aur common mistakes ki poori jaankari hai.',
    category: 'Government Services',
    tags: ['pan card', 'nsdl', 'online apply', 'aadhaar link'],
    author: '999tools Team',
    publishedAt: '2026-09-25',
    readTime: 6,
    bannerGradient: 'from-amber-500 to-orange-600',
    content: [
      { type: 'p', text: 'PAN card (Permanent Account Number) har Indian citizen ke liye zaroori document hai — chahe aap job kar rahe ho, business kar rahe ho, ya koi property kharid rahe ho. 2026 mein PAN card apply karna ab pehle se zyada easy ho gaya hai — bas online form fill karo aur 7-10 din mein card ghar aa jaata hai.' },
      { type: 'h2', text: 'PAN Card Ke Fayde' },
      { type: 'ul', items: [
        'Income tax return file karne ke liye mandatory',
        'Bank account khulwane ke liye (₹50,000+ deposit ke liye)',
        'Property kharidne-bechne ke liye',
        'High-value transactions (₹2 lakh+) track karne ke liye',
        'Business registration aur GST ke liye zaroori',
      ]},
      { type: 'h2', text: 'PAN Card Apply Karne Ke 3 Tarike' },
      { type: 'h3', text: '1. Online Apply (Fastest)' },
      { type: 'p', text: 'NSDL ya UTIITSL ke official website pe jao, form fill karo, documents upload karo, aur ₹107 fees pay karo. Ye sabse fast tarika hai.' },
      { type: 'h3', text: '2. Cyber Cafe / CSC Center Se' },
      { type: 'p', text: 'Agar aapko online process samajh nahi aata, to apne local CSC center ya cyber cafe se karwa sakte ho. Fees ₹150-250 hoti hai (extra service charge ke saath).' },
      { type: 'h3', text: '3. Physical Form Se' },
      { type: 'p', text: 'NSDL ke form 49A ko download karke bhar sakte ho aur kisi bhi TIN facilitation center pe jama kar sakte ho. Ye thoda purana tarika hai.' },
      { type: 'h2', text: 'Zaroori Documents' },
      { type: 'ul', items: [
        'Aadhaar card (identity + address proof)',
        'Passport size photo (recent)',
        'Date of birth proof (birth certificate / 10th marksheet)',
        'Mobile number aur email (verification ke liye)',
      ]},
      { type: 'h2', text: 'PAN Card Fees' },
      { type: 'ul', items: [
        'e-PAN (PDF) — ₹66 + GST = ₹78',
        'Physical PAN Card (India) — ₹91 + GST = ₹107',
        'Foreign address delivery — ₹871 + GST',
      ]},
      { type: 'h2', text: 'Common Mistakes Jo Nahi Karni' },
      { type: 'ul', items: [
        'Name galat likhna (aadhaar ke exactly same hona chahiye)',
        'Photo ke size aur background requirements ignore karna',
        'Aadhaar link nahi karna (income tax filing ke liye zaroori hai)',
        'Ek se zyada PAN card apply karna (illegal hai)',
      ]},
      { type: 'callout', title: '💡 Pro Tip', text: 'PAN card apply karne se pehle apna Aadhaar detail aur mobile number verify karo — yahi details PAN card mein aayengi. Agar naam ya DOB alag hai, to pehle Aadhaar update karwao.' },
      { type: 'cta', text: 'PAN card form mein aksar photo aur signature upload karna hota hai. Ye tools use karo:', linkText: 'Photo Resize Tool Try Karein →', link: '/' },
      { type: 'h2', text: 'Processing Time' },
      { type: 'p', text: 'Application submit karne ke baad 2-3 din mein acknowledgment number mil jaata hai. e-PAN 5-7 din mein email pe aata hai, aur physical card 7-15 din mein post se aata hai.' },
      { type: 'h2', text: 'PAN Card Aadhaar Se Link Karna' },
      { type: 'p', text: '1 July 2026 se PAN-Aadhaar link karna mandatory hai. Agar link nahi kiya, to PAN card invalid ho jayega aur ₹10,000 tak penalty lag sakti hai. Income Tax portal pe free of cost link kar sakte ho.' },
      { type: 'h2', text: 'Akhr Mein' },
      { type: 'p', text: 'PAN card apply karna aajkal bahut simple hai. Bas documents ready rakho, online form dhyan se bharo, aur fees pay karo. Agar aapko photo ya signature resize karna hai, to 999tools ke free tools use kar sakte ho — 100% free aur secure.' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 2: Aadhaar Update
  // ═══════════════════════════════════════════
  {
    slug: 'aadhaar-card-update-online-2026',
    title: 'Aadhaar Card Update Online 2026 — Address, Mobile, Name Change',
    excerpt:
      'Aadhaar card update kaise karein online? Address, mobile number, naam, DOB, gender — sab kuch UIDAI portal se update kar sakte ho. Complete guide padhein.',
    category: 'Government Services',
    tags: ['aadhaar', 'uidai', 'address update', 'mobile update'],
    author: '999tools Team',
    publishedAt: '2026-09-24',
    readTime: 5,
    bannerGradient: 'from-emerald-500 to-teal-600',
    content: [
      { type: 'p', text: 'Aadhaar card India ka sabse important identity document hai. Naam, address, mobile number, ya DOB mein kuch bhi change karna ho — sab kuch UIDAI ke portal se online kar sakte ho. Lekin ek baar update karne se pehle ye guide padh lo.' },
      { type: 'h2', text: 'Aadhaar Mein Kya-Kya Update Ho Sakta Hai?' },
      { type: 'ul', items: [
        'Naam (name change)',
        'Address (naya ghar ya city)',
        'Mobile number',
        'Email ID',
        'Date of birth',
        'Gender',
        'Photo',
      ]},
      { type: 'h2', text: 'Online Update Process' },
      { type: 'ol', items: [
        'myAadhaar.uidai.gov.in pe jao',
        'Login karo Aadhaar number + OTP se',
        'Update option select karo',
        'Nayi details bharo',
        'Supporting documents upload karo',
        'Update request number (URN) save karo',
        '10-15 din mein update ho jaata hai',
      ]},
      { type: 'h2', text: 'Fees Kitni Hai?' },
      { type: 'ul', items: [
        'Demographic update (name, address, DOB) — ₹50',
        'Biometric update (photo, fingerprint) — ₹100',
        'Mobile ya email update — Free',
      ]},
      { type: 'callout', title: '⚠️ Zaroori Baat', text: 'Aadhaar update ke liye online payment hone ke baad aapko update request number (URN) milega. Usse save kar lo — status check karne ke liye zaroori hai.' },
      { type: 'h2', text: 'Address Update Ke Liye Documents' },
      { type: 'ul', items: [
        'Bank passbook (front page)',
        'Electricity ya gas bill',
        'Ration card',
        'Voter ID',
        'Passport',
        'Rent agreement (agar rented hai)',
      ]},
      { type: 'h2', text: 'Common Issues' },
      { type: 'h3', text: '1. Biometric Update Ke Liye' },
      { type: 'p', text: 'Biometric (photo, fingerprint) update ke liye aapko physically Aadhaar Seva Kendra jaana padega. Online nahi hota.' },
      { type: 'h3', text: '2. Phone Number Update' },
      { type: 'p', text: 'Phone number update ke liye bhi Aadhaar Seva Kendra jaana padta hai (kyunki OTP current number pe aata hai, aur agar number khoya hua hai to naya link karna padega).' },
      { type: 'cta', text: 'Aadhaar form mein photo aur signature ka size aur format matter karta hai:', linkText: 'Photo Resize Tool →', link: '/' },
      { type: 'h2', text: 'Aadhaar Card Download Kaise Karein?' },
      { type: 'ol', items: [
        'myAadhaar.uidai.gov.in pe jao',
        'Aadhaar number daalo',
        'OTP verify karo',
        '"Download Aadhaar" click karo',
        'PDF download karo (password protected)',
      ]},
      { type: 'p', text: 'Password aapke naam ka first 4 letters (capital) + birth year hota hai. Example: PANKAJ1990' },
      { type: 'h2', text: 'Aadhaar Update Ke Fayde' },
      { type: 'ul', items: [
        'KYC verification easy ho jaati hai',
        'Sarkari yojna ka direct fayda milta hai',
        'Bank, mobile, gas connection — sab jaldi approve hote hain',
        'PAN-Aadhaar link karna easy ho jaata hai',
      ]},
      { type: 'h2', text: 'Last Words' },
      { type: 'p', text: 'Aadhaar update ek simple process hai — bas UIDAI portal pe jao, fees pay karo, aur documents upload karo. 10-15 din mein update ho jaata hai. Koi bhi confusion ho to CSC center ya cyber cafe se madad le sakte ho.' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 3: Passport Photo
  // ═══════════════════════════════════════════
  {
    slug: 'passport-size-photo-mobile-se-kaise-banaye',
    title: 'Passport Size Photo Mobile Se Kaise Banaye — Free Guide',
    excerpt:
      'Mobile se passport size photo kaise banaye ghar baithe? Koi studio jaane ki zaroorat nahi. Ye guide padhein aur 2 minute mein passport photo ready karein.',
    category: 'Photo & Tools',
    tags: ['passport photo', 'mobile', 'photo editing', 'free tools'],
    author: '999tools Team',
    publishedAt: '2026-09-23',
    readTime: 4,
    bannerGradient: 'from-indigo-500 to-purple-600',
    content: [
      { type: 'p', text: 'Sarkari form, exam registration, ya visa application — passport size photo har jagah chahiye. Studio jaane ka time nahi hai to ghar baithe mobile se 2 minute mein passport photo bana sakte ho. Ye guide follow karo.' },
      { type: 'h2', text: 'Passport Size Photo Ki Requirements' },
      { type: 'ul', items: [
        'Size — 35mm x 45mm (ya 2 inch x 2 inch)',
        'Background — White ya light color',
        'Face — 70-80% frame mein ho',
        'Expression — Neutral (no smile)',
        'Eyes — Open, clear',
        'Dress — Formal, dark color',
      ]},
      { type: 'h2', text: 'Mobile Se Passport Photo Banane Ke Steps' },
      { type: 'h3', text: 'Step 1: Perfect Photo Khincho' },
      { type: 'ul', items: [
        'Deewar ke saamne khade ho (plain white wall best hai)',
        'Natural light use karo — subah 10 baje ya shaam 4 baje',
        'Front camera se lo, phone tripod ya kisi aur se khinchwao',
        'Camera level pe rakho (aankhon ke barabar)',
      ]},
      { type: 'h3', text: 'Step 2: Background Remove/Crop Karo' },
      { type: 'p', text: 'Photo ko kisi free tool se crop karo. Agar background clean nahi hai, to background remove karne wale apps use karo.' },
      { type: 'h3', text: 'Step 3: Size Adjust Karo' },
      { type: 'p', text: 'Passport size 35x45mm hota hai. Iske liye 999tools ke photo resizer tool use karo — exact size set karke crop kar sakte ho.' },
      { type: 'h3', text: 'Step 4: Print Ke Liye Photo Sheet Banao' },
      { type: 'p', text: 'A4 sheet pe 8 ya 16 passport photos arrange karke print karo. Local print shop pe ₹20-30 mein print ho jaata hai.' },
      { type: 'callout', title: '💡 Pro Tip', text: 'Agar aapke paas pehle se koi bhi photo hai, to 999tools ke Image Format Converter aur Photo Crop tools se 2 minute mein passport size bana sakte ho.' },
      { type: 'h2', text: 'Common Mistakes' },
      { type: 'ul', items: [
        'Dark background use karna (white/light hona chahiye)',
        'Photo mein smile ya open teeth dikhana',
        'Caps, sunglasses, hat pehnna',
        'Photo bahut purani hona (6 mahine se zyada old nahi hona chahiye)',
        'Photo blurry ya low resolution hona',
      ]},
      { type: 'cta', text: 'Ek hi tool se cropping, resizing, aur background fix — sab kuch:', linkText: 'Photo Tools Free Try Karein →', link: '/' },
      { type: 'h2', text: 'Exam Form Ke Liye Alag Requirements' },
      { type: 'p', text: 'SSC, UPSC, Railway exam forms mein photo size alag-alag hoti hai. Aam taur pe photo — 20-50 KB aur signature — 10-20 KB. Isliye form bharne se pehle exam notification zaroor padhein.' },
      { type: 'h2', text: 'Kon Sa Mobile Best Hai?' },
      { type: 'p', text: 'Koi bhi mobile jismein 8MP+ camera hai, enough hai. iPhone, Samsung, Redmi — sab me passable photo ban jaati hai. Important hai lighting aur background.' },
      { type: 'h2', text: 'Conclusion' },
      { type: 'p', text: 'Passport size photo banane ke liye kisi professional studio jaane ki zaroorat nahi. Ghar pe mobile se photo khincho, free tools se crop karo, aur print karwao. Total cost — ₹20-30 bas!' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 4: Exam Form Photo Resize
  // ═══════════════════════════════════════════
  {
    slug: 'exam-form-photo-signature-resize',
    title: 'Exam Form Ke Liye Photo Aur Signature Resize Kaise Kare',
    excerpt:
      'SSC, UPSC, Railway exam form ke liye photo aur signature exact size mein resize karna zaroori hai. Ye guide follow karke 2 minute mein resize kar sakte ho.',
    category: 'Exam & Education',
    tags: ['exam form', 'photo resize', 'signature', 'ssc upsc'],
    author: '999tools Team',
    publishedAt: '2026-09-22',
    readTime: 5,
    bannerGradient: 'from-blue-500 to-cyan-600',
    content: [
      { type: 'p', text: 'Har saal lakhs of candidates exam form bharte hain, aur photo aur signature ke size galat hone ki wajah se form reject ho jaate hain. Ye guide aapko bataayega exact tarika jisse 2 minute mein correct size ki photo aur signature ban jaye.' },
      { type: 'h2', text: 'Common Exam Photo Requirements' },
      { type: 'p', text: 'Har exam ka alag size hota hai. Ye kuch popular exams ki requirements hain:' },
      { type: 'ul', items: [
        'SSC — Photo: 20-50 KB, Signature: 10-20 KB',
        'UPSC — Photo: 20-300 KB, Signature: 20-300 KB',
        'Railway (RRB) — Photo: 15-40 KB, Signature: 10-40 KB',
        'Bank PO — Photo: 20-50 KB, Signature: 10-20 KB',
        'State PSC — Different states ki alag requirements',
      ]},
      { type: 'h2', text: 'Photo Resize Karne Ka Sahi Tarika' },
      { type: 'h3', text: 'Step 1: Original Photo Ready Karo' },
      { type: 'p', text: 'Pehle se passport size photo ho to achha hai. Nahi hai to mobile se khincho aur white background rakho.' },
      { type: 'h3', text: 'Step 2: Image Compressor Tool Use Karo' },
      { type: 'p', text: '999tools ka Image Compressor tool use karo — target KB daalo aur tool automatically compress kar dega. Quality loss minimum hogi.' },
      { type: 'h3', text: 'Step 3: Final Size Check Karo' },
      { type: 'p', text: 'Download ke baad photo ka size check karo — agar exact nahi hua to quality percentage adjust karo.' },
      { type: 'h2', text: 'Signature Resize Karne Ka Tarika' },
      { type: 'ul', items: [
        'White paper pe blue ya black pen se sign karo',
        'Photo khincho (natural light mein)',
        'Photo Crop tool se sirf signature wala part crop karo',
        'Image Compressor se target KB set karo',
        'Background white hona chahiye',
      ]},
      { type: 'callout', title: '⚠️ Common Mistake', text: 'Signature ko dark background pe khinchna galat hai. Hamesha white paper pe sign karo aur photo sharp honi chahiye.' },
      { type: 'h2', text: 'Exact Size Kaise Set Karein?' },
      { type: 'p', text: 'SSC ke liye agar 20-50 KB chahiye, to photo 30 KB pe set karo (middle). Isse online portal accept kar lega.' },
      { type: 'h2', text: 'Photo Quality Achi Rahe Iske Liye' },
      { type: 'ol', items: [
        'Natural light use karo — flash avoid karo',
        'White ya light color wall ke saamne khade ho',
        'Camera 1 meter distance pe rakho',
        'Photo sharp honi chahiye — blur nahi',
        'Face clearly visible ho',
      ]},
      { type: 'cta', text: 'Exam form ke liye perfect photo aur signature banane ke liye:', linkText: 'Free Tools Use Karein →', link: '/' },
      { type: 'h2', text: 'Exam Form Bharne Se Pehle Checklist' },
      { type: 'ul', items: [
        'Photo size exact — 20-50 KB',
        'Signature size exact — 10-20 KB',
        'Photo recent (6 mahine se old nahi)',
        'Signature white background pe',
        'Photo mein naam aur date likha nahi ho',
        'Form ke instructions dobara padhein',
      ]},
      { type: 'h2', text: 'Agar Form Reject Ho Jaye?' },
      { type: 'p', text: 'Zyadatar exam boards ek correction window dete hain. Us time mein aap photo aur signature dobara upload kar sakte ho. Lekin better hai pehli baar hi sahi karo.' },
      { type: 'h2', text: 'Last Words' },
      { type: 'p', text: 'Exam form ke liye photo aur signature resize karna matter karta hai. 999tools pe free tools hain — 2 minute mein exact size bana sakte ho. Save karo, upload karo, aur form submit karo.' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 5: CSC VLE
  // ═══════════════════════════════════════════
  {
    slug: 'csc-vle-kaise-bane-2026',
    title: 'CSC VLE Kaise Bane 2026 — Complete Guide With Earnings',
    excerpt:
      'CSC VLE kaise bane? Kya documents chahiye? Kitna paisa lagta hai? Kitni earning hoti hai? Ye complete guide padhein aur 30 din mein VLE ban jayein.',
    category: 'Business & Career',
    tags: ['csc', 'vle', 'cyber cafe', 'business'],
    author: '999tools Team',
    publishedAt: '2026-09-21',
    readTime: 7,
    bannerGradient: 'from-rose-500 to-pink-600',
    content: [
      { type: 'p', text: 'CSC (Common Service Centre) ek Government of India initiative hai jismein aam nagrik ko digital services provide ki jaati hain. VLE (Village Level Entrepreneur) wo person hota hai jo apne area mein CSC center chalata hai. 2026 mein VLE banna ek profitable business hai — monthly ₹30,000 se ₹80,000 tak earning possible hai.' },
      { type: 'h2', text: 'VLE Kaise Bane — Step by Step' },
      { type: 'h3', text: 'Step 1: Eligibility Check Karo' },
      { type: 'ul', items: [
        'Age — 18+ years',
        'Education — 10th pass minimum',
        'Indian citizen',
        'Aadhaar card aur PAN card hona chahiye',
        'Bank account hona chahiye',
      ]},
      { type: 'h3', text: 'Step 2: CSC Portal Pe Register Karo' },
      { type: 'p', text: 'register.csc.gov.in pe jao, "Register as VLE" click karo, form fill karo aur documents upload karo. Registration fee ₹1,479 hai (ya ₹1,999 — plan ke hisaab se).' },
      { type: 'h3', text: 'Step 3: Documents Upload Karo' },
      { type: 'ul', items: [
        'Aadhaar card (front + back)',
        'PAN card',
        'Passport size photo',
        'Bank passbook ya cancel cheque',
        'Educational certificates',
      ]},
      { type: 'h3', text: 'Step 4: Payment Karo' },
      { type: 'p', text: 'Registration fees online pay karo. Iske baad CSC team verify karegi aur aapko VLE ID milega.' },
      { type: 'h3', text: 'Step 5: TEC Certificate Lo' },
      { type: 'p', text: 'TEC (Telecentre Entrepreneur Course) exam pass karna zaroori hai. Ye online exam hai — 60 minutes, 50 questions. Fees ₹1,479.' },
      { type: 'h2', text: 'Total Investment Kitna Hoga?' },
      { type: 'ul', items: [
        'CSC Registration — ₹1,479',
        'TEC Exam — ₹1,479',
        'Computer/Laptop — ₹15,000 - ₹25,000',
        'Printer — ₹5,000 - ₹10,000',
        'Internet Connection — ₹500/month',
        'Rent (agar rented shop hai) — ₹3,000 - ₹8,000/month',
      ]},
      { type: 'p', text: 'Total initial investment — ₹25,000 se ₹50,000.' },
      { type: 'h2', text: 'VLE Kitni Earning Kar Sakta Hai?' },
      { type: 'p', text: 'Earning aapke area aur services pe depend karti hai. Ye typical monthly earnings hain:' },
      { type: 'ul', items: [
        'PAN card apply — ₹20-30 commission per card',
        'Aadhaar update — ₹20-50 commission',
        'Insurance — ₹100-500 commission',
        'Passport — ₹50-100 commission',
        'Bill payments — 1-2% commission',
        'Print/Photocopy — ₹1-5 per page',
        'e-Stamp — ₹20-50 commission',
        'Railway ticket — ₹20-40 commission',
      ]},
      { type: 'callout', title: '💰 Earning Reality', text: 'Ek chhota CSC center (gaon ya tier-3 city mein) monthly ₹15,000-30,000 kama sakta hai. City ya busy area mein ₹50,000+ possible hai. Iske alawa bhi extra services (khatabook, photography, printing) se extra income ho sakti hai.' },
      { type: 'h2', text: 'CSC VLE Ke Fayde' },
      { type: 'ul', items: [
        'Government authorized ID card',
        '100+ government services access',
        'Respectable business',
        'Recurring income',
        'Apne area mein digital transformation',
        'Bank partnerships aur extra commissions',
      ]},
      { type: 'h2', text: 'VLE Ke Liye Free Tools' },
      { type: 'p', text: 'VLE hone ke naate aapko bahut saare tools daily use karne padenge — photo resizing, PDF conversion, ID card printing, khatabook. 999tools pe ye sab free hain — 700+ tools jo aapke business ko 10x faster karenge.' },
      { type: 'cta', text: '999tools VLE plan mein unlimited access hai — monthly ₹199 mein:', linkText: 'VLE Plan Dekhein →', link: '/' },
      { type: 'h2', text: 'Common Problems Jo VLE Face Karte Hain' },
      { type: 'h3', text: '1. Internet Slow' },
      { type: 'p', text: 'Chhote gaon mein internet slow hoti hai. Solution — Jio Fiber ya Airtel Xstream use karo.' },
      { type: 'h3', text: '2. Electricity Cut' },
      { type: 'p', text: 'UPS ya inverter backup rakho (₹5,000 se start).' },
      { type: 'h3', text: '3. Technical Knowledge' },
      { type: 'p', text: 'Har service ke liye training videos YouTube pe free hain. 999tools ka support team bhi help karti hai.' },
      { type: 'h2', text: 'Registration Ke Baad Kya?' },
      { type: 'ol', items: [
        'CSC ID card 15-30 din mein aa jayega',
        'Wall pe CSC board lagao (branding)',
        'Local logo ko batayenge services ki',
        'Dheere dheere customer base banao',
        'Bank partnerships se commissions badhao',
      ]},
      { type: 'h2', text: 'Conclusion' },
      { type: 'p', text: 'CSC VLE banna ek profitable aur respectable business hai. Initial investment ₹25,000-50,000 lagti hai, aur 3-6 months mein aap break-even kar sakte ho. Long term mein ye ek stable income source ban jaata hai.' },
      { type: 'p', text: 'Agar aap VLE banna chahte ho aur koi bhi help chahiye — registration, tools, ya business guidance — 999tools team aapki madad kar sakti hai. Comment karo ya WhatsApp karo!' },
    ],
  },
];

// ── Helper functions ──
export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return BLOG_POSTS.find((p) => p.slug === slug);
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(BLOG_POSTS.map((p) => p.category)));
};

export const getRelatedPosts = (currentSlug: string, limit = 3): BlogPost[] => {
  const current = getPostBySlug(currentSlug);
  if (!current) return BLOG_POSTS.slice(0, limit);

  return BLOG_POSTS.filter((p) => p.slug !== currentSlug)
    .sort((a, b) => {
      const aMatch = a.category === current.category ? 1 : 0;
      const bMatch = b.category === current.category ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
};

export const formatBlogDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};
