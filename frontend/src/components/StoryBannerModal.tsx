import { useState, useRef, useEffect } from 'react';
import type { PetReportDetail } from '../types';
import './StoryBannerModal.css';

interface Props {
  pet: PetReportDetail;
  onClose: () => void;
}

export default function StoryBannerModal({ pet, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const mainImageUrl = pet.images && pet.images.length > 0
    ? (pet.images.find(img => img.is_main)?.image || pet.images[0].image)
    : null;

  // Render High-Resolution Story Banner on HTML5 Canvas (1080 x 1920)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Background Gradient (Dark Luxurious Plum to Deep Rose)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#180e1c');
    bgGrad.addColorStop(0.35, '#2b1029');
    bgGrad.addColorStop(0.7, '#4a1132');
    bgGrad.addColorStop(1, '#831843');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative soft glow circles
    const drawGlow = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawGlow(200, 200, 350, 'rgba(255, 107, 157, 0.25)');
    drawGlow(880, 1600, 400, 'rgba(244, 63, 94, 0.25)');

    // Header Badge: Logo + Nana Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Vazirmatn, sans-serif';
    ctx.fillText('🐾 سامانه نانا | Nana Pet Finder', width / 2, 130);

    // Alert Ribbon (LOST or FOUND)
    const isLost = pet.report_type === 'LOST';
    const bannerColor = isLost ? '#e11d48' : '#16a34a';
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.roundRect(140, 170, 800, 90, 45);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Vazirmatn, sans-serif';
    ctx.fillText(
      isLost ? '🚨 آگهی فوری: حیوان گمشده 🚨' : '🟢 آگهی حیوان پیدا شده 🟢',
      width / 2,
      232
    );

    // Load Pet Image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const renderCardContent = () => {
      // Pet Main Image Frame
      const imgX = 140;
      const imgY = 300;
      const imgW = 800;
      const imgH = 650;

      // Image Container Background / Shadow
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 36);
      ctx.fill();
      ctx.clip();

      if (img.src && img.complete && img.naturalWidth > 0) {
        // Draw Cover-Fit Image
        const hRatio = imgW / img.naturalWidth;
        const vRatio = imgH / img.naturalHeight;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (imgW - img.naturalWidth * ratio) / 2;
        const centerShiftY = (imgH - img.naturalHeight * ratio) / 2;

        ctx.drawImage(
          img,
          0,
          0,
          img.naturalWidth,
          img.naturalHeight,
          imgX + centerShiftX,
          imgY + centerShiftY,
          img.naturalWidth * ratio,
          img.naturalHeight * ratio
        );
      } else {
        // Fallback placeholder icon
        ctx.fillStyle = '#fce7f3';
        ctx.fillRect(imgX, imgY, imgW, imgH);
        ctx.font = '160px sans-serif';
        ctx.fillStyle = '#ff6b9d';
        ctx.fillText(pet.pet_type === 'CAT' ? '🐱' : '🐶', width / 2, imgY + 380);
      }
      ctx.restore();

      // Border around image
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 36);
      ctx.stroke();

      // Details Card Box
      const cardY = 990;
      const cardH = 680;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(140, cardY, 800, cardH, 36);
      ctx.fill();

      // Card Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 50px Vazirmatn, sans-serif';
      const truncatedTitle = pet.title.length > 30 ? pet.title.slice(0, 30) + '...' : pet.title;
      ctx.fillText(truncatedTitle, width / 2, cardY + 80);

      // Info rows inside card
      ctx.textAlign = 'right';
      ctx.font = '500 38px Vazirmatn, sans-serif';
      ctx.fillStyle = '#334155';

      let textY = cardY + 160;
      const drawInfoLine = (icon: string, label: string, val: string) => {
        ctx.fillText(`${icon} ${label}:`, 900, textY);
        ctx.font = 'bold 38px Vazirmatn, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(val, 620, textY);
        ctx.font = '500 38px Vazirmatn, sans-serif';
        ctx.fillStyle = '#334155';
        textY += 65;
      };

      if (pet.name) drawInfoLine('🏷️', 'نام حیوان', pet.name);
      if (pet.breed) drawInfoLine('🐕', 'نژاد', pet.breed);
      if (pet.color) drawInfoLine('🎨', 'رنگ و مشخصه', pet.color);
      drawInfoLine('📍', 'محل حادثه', `${pet.city}${pet.district ? `، ${pet.district}` : ''}`);

      // Reward Banner inside card if reward > 0
      if (pet.reward && pet.reward > 0) {
        textY += 15;
        ctx.fillStyle = '#fef2f2';
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(180, textY - 45, 720, 80, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 42px Vazirmatn, sans-serif';
        ctx.fillText(`🎁 مژدگانی نقدی: ${pet.reward.toLocaleString('fa-IR')} تومان`, width / 2, textY + 12);
        textY += 90;
      }

      // Contact Phone Banner
      if (pet.contact_phone) {
        textY += 15;
        ctx.fillStyle = '#f0fdf4';
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(180, textY - 45, 720, 85, 22);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 44px Vazirmatn, sans-serif';
        ctx.fillText(`📞 شماره تماس: ${pet.contact_phone}`, width / 2, textY + 14);
      }

      // Footer call-to-action
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fce7f3';
      ctx.font = '500 34px Vazirmatn, sans-serif';
      ctx.fillText('🔗 مشاهده جزئیات کامل در سایت نانا:', width / 2, 1740);
      ctx.font = 'bold 38px Vazirmatn, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('nana-jet.vercel.app', width / 2, 1795);

      ctx.font = '400 28px Vazirmatn, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText('لطفاً این استوری را بازنشر کنید تا زودتر به خانه بازگردد ❤️', width / 2, 1855);

      // Export Blob
      canvas.toBlob(blob => {
        if (blob) setGeneratedBlob(blob);
      }, 'image/png');
    };

    if (mainImageUrl) {
      img.onload = renderCardContent;
      img.onerror = renderCardContent;
      img.src = mainImageUrl;
    } else {
      renderCardContent();
    }
  }, [pet, mainImageUrl]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `nana-story-${pet.id}-${pet.title.slice(0, 15)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (generatedBlob && navigator.canShare && navigator.canShare({ files: [new File([generatedBlob], 'story.png', { type: 'image/png' })] })) {
          const file = new File([generatedBlob], `nana-story-${pet.id}.png`, { type: 'image/png' });
          await navigator.share({
            title: pet.title,
            text: `📢 آگهی ${pet.title} در شهر ${pet.city}\nمشاهده در سامانه نانا:`,
            files: [file],
            url: window.location.href,
          });
        } else {
          await navigator.share({
            title: pet.title,
            text: `📢 آگهی ${pet.title} در شهر ${pet.city}`,
            url: window.location.href,
          });
        }
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleDownloadImage();
    }
  };

  const handleCopyCaption = () => {
    const isLost = pet.report_type === 'LOST';
    const caption = `🚨 ${isLost ? 'حیوان گمشده' : 'حیوان پیدا شده'}: ${pet.title}
📍 شهر: ${pet.city}${pet.district ? `، ${pet.district}` : ''}
🐾 نوع: ${pet.breed || pet.pet_type}
${pet.reward ? `🎁 مژدگانی: ${pet.reward.toLocaleString('fa-IR')} تومان\n` : ''}${pet.contact_phone ? `📞 تماس: ${pet.contact_phone}\n` : ''}🔗 لینک آگهی در سامانه نانا:
${window.location.href}

#حیوان_گمشده #سگ_گمشده #گربه_گمشده #نانا`;

    navigator.clipboard.writeText(caption);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="story-modal-box" onClick={e => e.stopPropagation()}>
        <div className="story-modal-header">
          <div>
            <h2 className="story-modal-title">📸 بنر استوری اینستاگرام</h2>
            <p className="story-modal-sub">بنر آماده برای استوری اینستاگرام، وضعیت واتساپ و تلگرام</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="story-modal-body">
          {/* Canvas Preview */}
          <div className="story-preview-wrap">
            <canvas ref={canvasRef} className="story-canvas" />
          </div>

          {/* Action Sidebar */}
          <div className="story-actions-wrap">
            <div className="story-tip-card">
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <p>
                تصویر با ابعاد استاندارد <strong>استوری (۹:۱۶)</strong> با کیفیت بالا تولید شد.
                با یک کلیک دانلود کنید و در استوری اینستاگرام یا استاتوس خود منتشر کنید.
              </p>
            </div>

            <button
              className="btn btn-primary btn-lg story-main-btn"
              onClick={handleDownloadImage}
              disabled={downloading}
            >
              📥 دانلود بنر استوری (PNG)
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                className="btn btn-outline btn-lg"
                onClick={handleNativeShare}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                📱 اشتراک مستقیم با موبایل
              </button>
            )}

            <button
              className="btn btn-ghost btn-lg"
              onClick={handleCopyCaption}
              style={{ width: '100%', justifyContent: 'center', border: '1px dashed var(--gray-300)' }}
            >
              {copiedText ? '✅ متن کپشن کپی شد!' : '📋 کپی متن آماده استوری / کپشن'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
