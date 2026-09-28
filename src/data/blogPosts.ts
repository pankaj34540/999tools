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
    // ═══════════════════════════════════════════
  // POST 6: Image Resizer
  // ═══════════════════════════════════════════
  {
    slug: 'image-resize-online-free-2026',
    title: 'Image Resize Online Free 2026 — Passport Size, Exam Form Guide',
    excerpt:
      'Image resize online free kaise karein? Passport size, exam form, ya social media ke liye exact pixels mein photo resize karne ka complete guide — 999tools ke free tool ke saath.',
    category: 'Photo & Tools',
    tags: ['image resize', 'passport photo', 'exam form', 'online tool'],
    author: '999tools Team',
    publishedAt: '2026-09-28',
    readTime: 5,
    bannerGradient: 'from-rose-500 to-pink-600',
    content: [
      { type: 'p', text: 'Har sarkari form, exam registration, ya social media platform ke liye image ka size alag hota hai. Photo galat size ki ho to form reject ho jaata hai, ya upload hi nahi hoti. Isliye image resize karna ek basic skill ban gaya hai — aur 999tools pe ye kaam 10 second mein ho jaata hai, bilkul free.' },
      { type: 'h2', text: 'Image Resize Kyun Zaroori Hai?' },
      { type: 'ul', items: [
        'Sarkari exam forms mein exact dimension chahiye hoti hai',
        'Passport photo ka size 35mm × 45mm hota hai',
        'SSC, UPSC, Railway, Bank PO — sab ki alag requirement',
        'Social media platforms (Instagram, Facebook, YouTube) ke specific sizes',
        'Print quality ke liye DPI match karna zaroori',
      ]},
      { type: 'h2', text: 'Image Resize Online Kaise Karein — 3 Steps' },
      { type: 'h3', text: 'Step 1: Tool Kholo' },
      { type: 'p', text: '999tools kholo → "Image Resizer" tool select karo. Koi signup nahi, koi ad bloat nahi — direct kaam shuru.' },
      { type: 'h3', text: 'Step 2: Image Upload Karo' },
      { type: 'p', text: 'Drag-and-drop karo ya click karke select karo. Multiple images ek saath upload kar sakte ho (batch processing).' },
      { type: 'h3', text: 'Step 3: Dimension Set Karo' },
      { type: 'p', text: 'Width aur height manually daalo, ya quick presets use karo (Instagram Post, Passport Photo, YouTube Thumbnail, etc.). "Fit" mode mein aspect ratio preserve rehta hai, "Fill" mein crop karke exact size milta hai.' },
      { type: 'callout', title: '💡 Pro Tip', text: 'Aspect ratio lock (🔒) ON rakho jab tak tumhe intentional stretch nahi chahiye. Isse photo distorted nahi hoti.' },
      { type: 'h2', text: 'Common Image Sizes — Quick Reference' },
      { type: 'ul', items: [
        'Passport Photo — 600×600 px (35×45 mm)',
        'Exam Form Photo — 200×230 px',
        'Instagram Post — 1080×1080 px',
        'Instagram Story — 1080×1920 px',
        'YouTube Thumbnail — 1280×720 px',
        'Facebook Cover — 820×312 px',
        'WhatsApp DP — 500×500 px',
      ]},
      { type: 'h2', text: 'Sabse Aam Galtiyaan' },
      { type: 'ul', items: [
        'Aspect ratio ignore karke stretch karna (photo patli ya moti lagegi)',
        'Bahut chhota size set karna (blurry output)',
        'Original se zyada bada karne ki koshish (quality loss)',
        'Final size check na karna (form reject)',
      ]},
      { type: 'cta', text: 'Image Resize ab 10 second ka kaam hai — bina quality loss, bina watermark:', linkText: 'Image Resizer Free Try Karein →', link: '/' },
      { type: 'h2', text: 'Batch Processing — Ek Saath Kai Images' },
      { type: 'p', text: 'Agar tumhe 20 passport photos resize karne hain, ya 50 product images ek jaisa size chahiye — 999tools mein batch upload karo. Sab par same size apply hoga, aur ZIP mein sab download kar sakte ho.' },
      { type: 'h2', text: 'Privacy — Tumhari Photo Safe Hai' },
      { type: 'p', text: 'Sab processing tumhare browser mein hoti hai (client-side). Tumhari photo kisi server pe upload nahi hoti. 100% private aur secure.' },
      { type: 'h2', text: 'Conclusion' },
      { type: 'p', text: 'Image resize karna aajkal ek click ka kaam hai — agar sahi tool ho. 999tools ka Image Resizer free hai, unlimited hai, aur batch support karta hai. Ek baar try karo — wapas purane tools pe nahi jaoge.' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 7: Image Compressor
  // ═══════════════════════════════════════════
  {
    slug: 'image-compress-to-20kb-50kb-2026',
    title: 'Image Compress to 20KB, 50KB Online Free — Exam Form Ke Liye',
    excerpt:
      'Sarkari exam form ke liye photo 20KB-50KB mein compress karni hai? Signature 10KB mein? Ye guide padhein — exact KB target set karke free compress karein.',
    category: 'Exam & Education',
    tags: ['image compress', 'exam form', '20kb', '50kb', 'reduce size'],
    author: '999tools Team',
    publishedAt: '2026-09-28',
    readTime: 6,
    bannerGradient: 'from-orange-500 to-red-600',
    content: [
      { type: 'p', text: 'Har exam form mein photo aur signature ke liye exact KB size likha hota hai — "Photo: 20-50 KB, Signature: 10-20 KB". Agar tumhari photo 200 KB hai ya 15 KB hai, dono cases mein form reject ho sakta hai. Isliye target KB pe compress karna ek must-have skill hai.' },
      { type: 'h2', text: 'Exam Form Ki Common Requirements' },
      { type: 'ul', items: [
        'SSC CGL / CHSL — Photo: 20-50 KB, Sign: 10-20 KB',
        'UPSC Civil Services — Photo: 20-300 KB, Sign: 20-300 KB',
        'Railway (RRB NTPC / Group D) — Photo: 15-40 KB, Sign: 10-40 KB',
        'Bank PO / Clerk — Photo: 20-50 KB, Sign: 10-20 KB',
        'State PSC — Alag-alag state ke alag rules',
        'Police Bharti — Kabhi 20 KB, kabhi 100 KB',
      ]},
      { type: 'callout', title: '⚠️ Note', text: 'Form bharne se pehle notification zaroor padho — har exam ka target KB alag hota hai. Ek hi size sab ke liye kaam nahi karega.' },
      { type: 'h2', text: 'Exact KB Mein Compress Kaise Karein' },
      { type: 'h3', text: 'Step 1: Image Compressor Kholo' },
      { type: 'p', text: '999tools pe "Image Compressor" tool select karo.' },
      { type: 'h3', text: 'Step 2: Target KB Set Karo' },
      { type: 'p', text: 'Preset buttons mein se choose karo (20 KB / 50 KB / 100 KB), ya custom KB type karo. Binary search algorithm automatically best quality dhundhega jo target ke closest ho.' },
      { type: 'h3', text: 'Step 3: Apply Compression' },
      { type: 'p', text: '"Apply Compression" click karo — tool quality aur dimension dono adjust karega jab tak target size na mile. Live preview mein before/after dekh sakte ho.' },
      { type: 'h3', text: 'Step 4: Download Karo' },
      { type: 'p', text: 'Ek click mein compressed image download. Batch ho to ZIP mein sab mil jayengi.' },
      { type: 'h2', text: 'Signature 10 KB Mein Kaise Laayein?' },
      { type: 'ol', items: [
        'White paper pe blue/black pen se sign karo',
        'Natural light mein photo khincho (flash nahi)',
        'Photo Crop tool se sirf signature crop karo',
        'Image Compressor mein 10 KB target set karo',
        'Download karo aur size verify karo',
      ]},
      { type: 'h2', text: 'Compression Ke Fayde' },
      { type: 'ul', items: [
        'Form accept hone ka chance 100%',
        'Fast upload (slow internet pe bhi)',
        'Email/WhatsApp pe easily bhej sakte ho',
        'Server bandwidth bachti hai',
        'Storage space bachta hai',
      ]},
      { type: 'h2', text: 'Common Galtiyaan' },
      { type: 'ul', items: [
        'Bahut zyada compress karna (photo dhundhli lagegi)',
        'Quality check na karna (chehra pehchanna mushkil)',
        'Wrong KB set karna (form reject)',
        'Resolution ignore karna (blurry output)',
      ]},
      { type: 'cta', text: 'Exact KB mein image compress karna ab 5 second ka kaam hai:', linkText: 'Image Compressor Free Use Karein →', link: '/' },
      { type: 'h2', text: 'Deep Compression — Bahut Badi Files Ke Liye' },
      { type: 'p', text: 'Agar photo 5 MB ki hai aur target 30 KB hai, to normal compression se quality bahut giregi. Is case mein dimension bhi reduce karni padegi. Tool ye automatically kar deta hai — 1200px pe resize karke compress karta hai.' },
      { type: 'h2', text: 'Kya File Safe Hai?' },
      { type: 'p', text: '100%. Sab processing browser mein hoti hai. Tumhari photo kisi server pe nahi jaati, kisi ke paas nahi jaati. Complete privacy.' },
      { type: 'h2', text: 'Conclusion' },
      { type: 'p', text: 'Exam form ke liye photo aur signature exact KB mein compress karna sabse important step hai. 999tools ka free tool 10 second mein ye kaam kar deta hai — bina watermark, bina registration. Ek baar try karo!' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 8: Photo Crop
  // ═══════════════════════════════════════════
  {
    slug: 'photo-crop-online-free-passport-photo',
    title: 'Photo Crop Online Free — Passport Photo Kaise Banaye Mobile Se',
    excerpt:
      'Photo crop online free kaise karein? Passport size, exam form, ya social media ke liye photo crop karne ka easy tarika — interactive crop tool ke saath.',
    category: 'Photo & Tools',
    tags: ['photo crop', 'passport photo', 'crop tool', 'mobile'],
    author: '999tools Team',
    publishedAt: '2026-09-28',
    readTime: 5,
    bannerGradient: 'from-teal-500 to-cyan-600',
    content: [
      { type: 'p', text: 'Photo crop karna sabse basic skill hai — chahe aap passport photo banana chahte ho, exam form ki photo trim karni ho, ya Instagram post ke liye perfect square chahiye. Achhi khabar ye hai ki ab koi Photoshop nahi chahiye. Browser mein hi 30 second mein crop ho jaata hai.' },
      { type: 'h2', text: 'Photo Crop Kab Zaroori Hota Hai?' },
      { type: 'ul', items: [
        'Passport size photo (35×45 mm)',
        'Exam form ki photo exact dimensions mein',
        'Signature crop karna (sirf sign wala part)',
        'Instagram square post (1:1)',
        'Story format (9:16)',
        'Facebook cover (820×312)',
        'ID card ke liye photo',
        'Background remove karne se pehle crop',
      ]},
      { type: 'h2', text: 'Photo Crop Online Free — Kaise Karein' },
      { type: 'h3', text: 'Step 1: Photo Crop Tool Kholo' },
      { type: 'p', text: '999tools pe "Photo Crop" tool select karo. Interactive crop editor khulega.' },
      { type: 'h3', text: 'Step 2: Aspect Ratio Choose Karo' },
      { type: 'p', text: 'Quick preset buttons mein se select karo — Free, 1:1, 4:3, 3:2, 16:9, 9:16, Passport (35:45), ya A4.' },
      { type: 'h3', text: 'Step 3: Crop Box Adjust Karo' },
      { type: 'p', text: 'White box ke corners drag karo resize karne ke liye. Box ke andar drag karo move karne ke liye. Live preview mein cropped result turant dikh jayega.' },
      { type: 'h3', text: 'Step 4: Download Karo' },
      { type: 'p', text: 'Ek click mein cropped image download. Multiple photos ho to batch crop karke ZIP mein le sakte ho.' },
      { type: 'callout', title: '💡 Pro Tip', text: 'Passport photo banane ke liye: 35:45 aspect ratio select karo, phir crop box ko face ke around centre karo. Shoulders thoda visible rakho, top of head thoda space chhodo.' },
      { type: 'h2', text: 'Passport Photo Ke Liye Exact Setup' },
      { type: 'ul', items: [
        'Aspect Ratio: 35:45 (passport preset)',
        'Face — 70-80% frame mein',
        'Top of head — 3-4 mm from top edge',
        'Background — white ya light color',
        'Expression — neutral, eyes open',
      ]},
      { type: 'h2', text: 'Signature Crop Karne Ka Sahi Tarika' },
      { type: 'ol', items: [
        'White paper pe sign karo (blue ya black pen)',
        'Photo khincho (natural light, no shadow)',
        'Photo Crop tool mein "Free" aspect select karo',
        'Sirf signature wala part tight crop karo',
        'Image Compressor se target KB set karo',
      ]},
      { type: 'h2', text: 'Interactive Crop Ke Fayde' },
      { type: 'ul', items: [
        'Live preview — real-time result',
        'Pixel-perfect precision',
        'Aspect ratio lock se distortion nahi',
        'Multiple images ek saath',
        'Koi watermark nahi',
        '100% free, unlimited use',
      ]},
      { type: 'cta', text: 'Crop, resize, aur compress — sab kuch ek hi jagah free mein:', linkText: 'Photo Crop Tool Try Karein →', link: '/' },
      { type: 'h2', text: 'Common Galtiyaan' },
      { type: 'ul', items: [
        'Bahut tight crop karna (face cut ho jaata hai)',
        'Bahut loose crop (background zyada dikhta hai)',
        'Aspect ratio ghalat choose karna',
        'Blurry original se crop karna',
        'Crop ke baad compress na karna',
      ]},
      { type: 'h2', text: 'Privacy Aur Security' },
      { type: 'p', text: 'Crop operation browser mein hi hoti hai. Photo server pe upload nahi hoti. Aapke photos aapke device pe hi rehte hain — 100% secure.' },
      { type: 'h2', text: 'Conclusion' },
      { type: 'p', text: 'Photo crop karna aajkal koi mushkil kaam nahi hai. 999tools ka free tool interactive hai, fast hai, aur accurate hai. Passport photo ho ya Instagram post — 30 second mein perfect crop.' },
    ],
  },

  // ═══════════════════════════════════════════
  // POST 9: PDF Merge
  // ═══════════════════════════════════════════
  {
    slug: 'pdf-merge-online-free-multiple-pdf-ko-ek-kaise-banaye',
    title: 'PDF Merge Online Free — Multiple PDF Ko Ek Kaise Banaye',
    excerpt:
      'PDF merge online free kaise karein? Multiple PDF files ko ek PDF mein combine karne ka complete guide — bina Adobe, bina watermark, browser mein.',
    category: 'PDF & Documents',
    tags: ['pdf merge', 'combine pdf', 'pdf tool', 'free pdf'],
    author: '999tools Team',
    publishedAt: '2026-09-28',
    readTime: 5,
    bannerGradient: 'from-blue-500 to-indigo-600',
    content: [
      { type: 'p', text: 'Kabhi kabhi 2-3 PDFs ko ek PDF mein combine karna padta hai — jaise aadhaar front + back, ya multiple documents bank ke liye. Adobe Acrobat paid hai, aur free online tools mein watermark lag jata hai. 999tools ka PDF Merge tool bilkul free hai, watermark-free hai, aur sab kuch browser mein karta hai.' },
      { type: 'h2', text: 'PDF Merge Kab Kaam Aata Hai?' },
      { type: 'ul', items: [
        'Aadhaar front + back ek PDF mein',
        'Bank KYC ke liye multiple documents',
        'Resume + cover letter + certificates',
        'Project reports jodna',
        'Invoices combine karna',
        'Exam form ke saath required documents',
        'Scanned pages ek file mein',
      ]},
      { type: 'h2', text: 'PDF Merge Kaise Karein — 4 Steps' },
      { type: 'h3', text: 'Step 1: Tool Kholo' },
      { type: 'p', text: '999tools → "PDF Merge" tool select karo.' },
      { type: 'h3', text: 'Step 2: PDFs Upload Karo' },
      { type: 'p', text: '2 ya zyada PDF files drag-and-drop karo, ya click karke select karo. Tool turant page count aur file size dikhayega.' },
      { type: 'h3', text: 'Step 3: Order Set Karo' },
      { type: 'p', text: 'PDFs ko ↑ ↓ buttons se reorder karo. Jis order mein list mein hain, usi order mein pages final PDF mein aayenge.' },
      { type: 'h3', text: 'Step 4: Merge Karo' },
      { type: 'p', text: '"Merge PDFs" button click karo — 2 second mein combined PDF download ho jaayegi.' },
      { type: 'callout', title: '💡 Pro Tip', text: 'Pehle soch lo konsa PDF pehla chahiye. Example: Aadhaar front pehla, back dusra. Isse reorder karne ki zaroorat nahi padegi.' },
      { type: 'h2', text: 'PDF Merge Ke Fayde — 999tools Ke Saath' },
      { type: 'ul', items: [
        '100% free — koi hidden charge nahi',
        'Koi watermark nahi',
        'Koi file size limit nahi (browser memory jitni)',
        'Koi signup nahi chahiye',
        'Unlimited merges per day',
        'Privacy — files server pe nahi jaati',
        'Fast — browser mein process hota hai',
      ]},
      { type: 'h2', text: 'Common Galtiyaan' },
      { type: 'ul', items: [
        'Encrypted PDF merge karne ki koshish (password remove karo pehle)',
        'Bahut badi files ek saath (browser slow ho sakta hai)',
        'Order check na karna (pages ulta aa jaate hain)',
      ]},
      { type: 'h2', text: 'Alternative — PDF Split Bhi Free Hai' },
      { type: 'p', text: 'Agar tumhe ek PDF se specific pages nikalne hain, to "PDF Split" tool use karo. Range daalo (jaise 1-3, 5, 7-9) aur sirf wahi pages ki nayi PDF download karo. Ya "Split Each Page" se har page ki alag PDF bana lo.' },
      { type: 'h2', text: 'PDF Merge vs Other Free Tools' },
      { type: 'p', text: 'Online PDF merge tools mein aam taur pe:' },
      { type: 'ul', items: [
        'Watermark lagate hain — 999tools nahi lagata',
        'File size limit hoti hai — 999tools unlimited',
        'Email pe link bhejte hain — 999tools direct download',
        'Files server pe upload karte hain — 999tools browser mein hi process karta hai',
      ]},
      { type: 'cta', text: 'Ek click mein multiple PDFs ko combine karo — bina watermark, bina signup:', linkText: 'PDF Merge Free Try Karein →', link: '/' },
      { type: 'h2', text: 'Privacy Kaise Maintain Hoti Hai?' },
      { type: 'p', text: 'PDF Merge tool mein sab processing browser mein hoti hai (pdf-lib library se). Tumhari PDF kisi server pe upload nahi hoti. Bank statements, KYC documents, ya personal papers — sab safe.' },
      { type: 'h2', text: 'Conclusion' },
      { type: 'p', text: 'PDF merge karna ek basic requirement hai — chahe office work ho ya personal. 999tools ka free tool watermark-free, signup-free, aur privacy-safe hai. Ek baar try karke dekho — Adobe ki zaroorat hi nahi padegi.' },
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
