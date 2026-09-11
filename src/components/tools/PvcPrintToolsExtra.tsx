import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Upload, 
  CreditCard, 
  Scissors, 
  Grid, 
  Check, 
  HeartHandshake, 
  Vote, 
  Car,
  AlertCircle
} from 'lucide-react';
import { AdsterraBanner, useAdsterraDirectLink } from '../common/AdsterraBanner';

interface ToolProps {
  onClose?: () => void;
}

// -------------------------------------------------------------
// Helper to render Standard CR80 PVC Card layout (85.6mm x 54mm)
// -------------------------------------------------------------
const renderPvcCardLayout = (
  canvas: HTMLCanvasElement,
  frontSrc: string | null,
  backSrc: string | null,
  cardTitle: string,
  paperType: '4x6' | 'a4' = '4x6'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 300 DPI: 4x6 = 1200 x 1800; CR80 card = 1011 x 638 px (85.6mm x 54mm)
  if (paperType === '4x6') {
    canvas.width = 1200;
    canvas.height = 1800;
  } else {
    canvas.width = 1240;
    canvas.height = 1754; // A4
  }

  // Pure white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cardW = 960;
  const cardH = 605;
  const x = (canvas.width - cardW) / 2;
  const yFront = 140;
  const yBack = yFront + cardH + 110;

  // Draw Header Watermark / Title for Cyber Cafe
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`999tools - ${cardTitle} CR80 Standard PVC Print Sheet`, canvas.width / 2, 80);

  // Front Card Outline & Image
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, yFront, cardW, cardH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, yFront, cardW, cardH);

  if (frontSrc) {
    const fImg = new Image();
    fImg.onload = () => ctx.drawImage(fImg, x, yFront, cardW, cardH);
    fImg.src = frontSrc;
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${cardTitle} FRONT SIDE (85.6mm x 54mm)`, canvas.width / 2, yFront + cardH / 2);
  }

  // Back Card Outline & Image
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x, yBack, cardW, cardH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, yBack, cardW, cardH);

  if (backSrc) {
    const bImg = new Image();
    bImg.onload = () => ctx.drawImage(bImg, x, yBack, cardW, cardH);
    bImg.src = backSrc;
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${cardTitle} BACK SIDE (85.6mm x 54mm)`, canvas.width / 2, yBack + cardH / 2);
  }

  // Scissor & Cut Guidelines
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;

  // Horizontal divider
  const midY = (yFront + cardH + yBack) / 2;
  ctx.beginPath();
  ctx.moveTo(x - 60, midY);
  ctx.lineTo(x + cardW + 60, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scissor instruction
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('✂ Cut along dotted guide & fold / insert into CR80 Lamination Pouch', canvas.width / 2, midY - 12);
};

// -------------------------------------------------------------
// #012: PAN Card PVC Layout Maker
// -------------------------------------------------------------
export const PanCardFormatterTool: React.FC<ToolProps> = () => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    if (canvasRef.current) {
      renderPvcCardLayout(canvasRef.current, frontImage, backImage, 'PAN CARD');
    }
  }, [frontImage, backImage]);

  const handlePrint = () => {
    triggerDirectLink();
    if (!canvasRef.current) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print PAN Card PVC</title></head>
          <body style="margin:0;display:flex;justify-content:center;">
            <img src="${canvasRef.current.toDataURL()}" style="width:100%;max-width:4in;"/>
            <script>window.onload = function() { window.print(); window.close(); };</script>
          </body>
        </html>
      `);
    }
  };

  const handleDownload = () => {
    triggerDirectLink();
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `PAN_Card_PVC_Sheet_${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #012
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            PAN Card PVC Print Sheet Formatter
          </h2>
          <p className="text-xs text-slate-500">
            Aligns NSDL / UTI PAN front & back scans into exact CR80 size with cutting marks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">1. Upload PAN Front Scan:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = () => setFrontImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">2. Upload PAN Back Scan:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = () => setBackImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
              className="w-full text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Direct Print (4x6 Photo Paper)</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Sheet</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto bg-white"
            style={{ width: '220px', height: 'auto' }}
          />
          <p className="text-[11px] text-slate-500 mt-2">Scale: Standard 4x6" Glossy Lab Paper</p>
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #013: Ayushman / E-Shram Card Sheet Formatter
// -------------------------------------------------------------
export const AyushmanCardFormatterTool: React.FC<ToolProps> = () => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    if (canvasRef.current) {
      renderPvcCardLayout(canvasRef.current, frontImage, backImage, 'AYUSHMAN / E-SHRAM');
    }
  }, [frontImage, backImage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #013
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Ayushman Bharat / E-Shram Smart Card Formatter
          </h2>
          <p className="text-xs text-slate-500">
            Instant PVC smart card print layout for PMJAY Golden card & National Labor card.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Front Card Scan:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = () => setFrontImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Back Card Scan:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = () => setBackImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
              className="w-full text-xs"
            />
          </div>

          <button
            onClick={() => {
              triggerDirectLink();
              if (canvasRef.current) {
                const link = document.createElement('a');
                link.download = `Ayushman_Eshram_Sheet.jpg`;
                link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
                link.click();
              }
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res Print Sheet</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto bg-white"
            style={{ width: '220px', height: 'auto' }}
          />
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #014: Voter ID (EPIC) Card Print Formatter
// -------------------------------------------------------------
export const VoterIdFormatterTool: React.FC<ToolProps> = () => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    if (canvasRef.current) {
      renderPvcCardLayout(canvasRef.current, frontImage, backImage, 'VOTER EPIC CARD');
    }
  }, [frontImage, backImage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #014
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Voter ID (EPIC) Card Print Formatter
          </h2>
          <p className="text-xs text-slate-500">
            Formats latest Election Commission of India e-EPIC PDF download into PVC card.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onload = () => setFrontImage(r.result as string);
                r.readAsDataURL(f);
              }
            }}
            className="w-full text-xs"
          />
          <button
            onClick={() => {
              triggerDirectLink();
              if (canvasRef.current) {
                const link = document.createElement('a');
                link.download = `Voter_EPIC_PVC_Sheet.jpg`;
                link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
                link.click();
              }
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Voter PVC Layout</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto bg-white"
            style={{ width: '220px', height: 'auto' }}
          />
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #015: Driving License / RC Card Layout Maker
// -------------------------------------------------------------
export const DlRcFormatterTool: React.FC<ToolProps> = () => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    if (canvasRef.current) {
      renderPvcCardLayout(canvasRef.current, frontImage, backImage, 'DRIVING LICENSE / RC');
    }
  }, [frontImage, backImage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #015
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Driving License & Vehicle RC Print Formatter
          </h2>
          <p className="text-xs text-slate-500">
            Parivahan Sarathi DL & Vahan Smart Card dual-side alignment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const r = new FileReader();
                r.onload = () => setFrontImage(r.result as string);
                r.readAsDataURL(f);
              }
            }}
            className="w-full text-xs"
          />
          <button
            onClick={() => {
              triggerDirectLink();
              if (canvasRef.current) {
                const link = document.createElement('a');
                link.download = `DL_RC_PVC_Sheet.jpg`;
                link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
                link.click();
              }
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download DL Print Sheet</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto bg-white"
            style={{ width: '220px', height: 'auto' }}
          />
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #017: Cut Guide & Lamination Marks Marker
// -------------------------------------------------------------
export const CutGuideMarkerTool: React.FC<ToolProps> = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 400);

    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 40, 40, 520, 320);
        // Add corner cut marks
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        // Top Left
        ctx.beginPath();
        ctx.moveTo(20, 40);
        ctx.lineTo(40, 40);
        ctx.moveTo(40, 20);
        ctx.lineTo(40, 40);
        // Top Right
        ctx.moveTo(560, 40);
        ctx.lineTo(580, 40);
        ctx.moveTo(560, 20);
        ctx.lineTo(560, 40);
        // Bottom Left
        ctx.moveTo(20, 360);
        ctx.lineTo(40, 360);
        ctx.moveTo(40, 360);
        ctx.lineTo(40, 380);
        // Bottom Right
        ctx.moveTo(560, 360);
        ctx.lineTo(580, 360);
        ctx.moveTo(560, 360);
        ctx.lineTo(560, 380);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('✂ 2mm Bleed & Cutting Guides Added', 40, 390);
      };
      img.src = imageSrc;
    } else {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(40, 40, 520, 320);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload Any Card / Badge to Add Precision Cut Ticks', 300, 200);
    }
  }, [imageSrc]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #017
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            Lamination Cut-Marks & Crop Guide Adder
          </h2>
          <p className="text-xs text-slate-500">
            Adds corner crop ticks and 2mm safe bleed margins for paper rotary cutters.
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs max-w-lg mx-auto">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const r = new FileReader();
              r.onload = () => setImageSrc(r.result as string);
              r.readAsDataURL(f);
            }
          }}
          className="w-full text-xs"
        />

        <div className="p-2 bg-white rounded-lg border text-center">
          <canvas ref={canvasRef} className="max-w-full h-auto mx-auto" />
        </div>

        <button
          disabled={!imageSrc}
          onClick={() => {
            triggerDirectLink();
            if (canvasRef.current) {
              const link = document.createElement('a');
              link.download = `Cut_Guide_Card.jpg`;
              link.href = canvasRef.current.toDataURL('image/jpeg');
              link.click();
            }
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
        >
          <Scissors className="w-4 h-4" />
          <span>Download with Crop Guides</span>
        </button>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};

// -------------------------------------------------------------
// #018: 5-in-1 Multi-Card on Single A4 Sheet
// -------------------------------------------------------------
export const MultiCardA4Tool: React.FC<ToolProps> = () => {
  const [cards, setCards] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { triggerDirectLink } = useAdsterraDirectLink();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 300 DPI
    canvas.width = 1240;
    canvas.height = 1754;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1240, 1754);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('999tools - 5-in-1 Bulk A4 PVC Sheet (Saves Expensive Photo Paper)', 620, 70);

    const cardW = 520;
    const cardH = 328;
    const positions = [
      { x: 80, y: 120 },
      { x: 640, y: 120 },
      { x: 80, y: 490 },
      { x: 640, y: 490 },
      { x: 360, y: 860 },
    ];

    positions.forEach((pos, idx) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pos.x, pos.y, cardW, cardH);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, cardW, cardH);

      if (cards[idx]) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, pos.x, pos.y, cardW, cardH);
        img.src = cards[idx];
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`Card Slot #${idx + 1} (Empty)`, pos.x + cardW / 2, pos.y + cardH / 2);
      }
    });
  }, [cards]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-sm">
            TOOL #018
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            5-in-1 Multi-Card on Single A4 Sheet
          </h2>
          <p className="text-xs text-slate-500">
            Print 5 different customer cards on 1 A4 glossy sheet to maximize cyber cafe profit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <label className="font-bold text-slate-700 block">Upload up to 5 Cards (Front/Back):</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                const arr: string[] = [];
                const fileList: File[] = Array.from(e.target.files);
                fileList.slice(0, 5).forEach((file: File) => {
                  const r = new FileReader();
                  r.onload = () => {
                    arr.push(r.result as string);
                    if (arr.length === Math.min(5, fileList.length)) {
                      setCards([...arr]);
                    }
                  };
                  r.readAsDataURL(file);
                });
              }
            }}
            className="w-full text-xs"
          />

          <button
            onClick={() => {
              triggerDirectLink();
              if (canvasRef.current) {
                const link = document.createElement('a');
                link.download = `5_in_1_A4_Sheet.jpg`;
                link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
                link.click();
              }
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download 5-in-1 A4 Sheet</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg border border-slate-300 max-w-full h-auto bg-white"
            style={{ width: '220px', height: 'auto' }}
          />
        </div>
      </div>

      <AdsterraBanner slot="tool_in_content" />
    </div>
  );
};
