import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(`${title} — ${currentUrl}`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div id="writing-share-buttons" className="my-10 pt-6 border-t border-[#DDD6CC]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6F6961]">
      <div className="flex items-center gap-1.5 text-xs text-[#6F6961] font-medium">
        <Share2 className="w-3.5 h-3.5 opacity-70" />
        <span>লেখাটি ভাগ করে নিন:</span>
      </div>

      <div className="flex items-center gap-2">
        {/* WhatsApp */}
        <a
          id="share-whatsapp-link"
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 bg-[#F1ECE4] hover:bg-[#DDD6CC]/60 text-[#211F1C] rounded transition-colors"
          title="WhatsApp-এ শেয়ার করুন"
        >
          WhatsApp
        </a>

        {/* Facebook */}
        <a
          id="share-facebook-link"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 bg-[#F1ECE4] hover:bg-[#DDD6CC]/60 text-[#211F1C] rounded transition-colors"
          title="Facebook-এ শেয়ার করুন"
        >
          Facebook
        </a>

        {/* X (Twitter) */}
        <a
          id="share-x-link"
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 bg-[#F1ECE4] hover:bg-[#DDD6CC]/60 text-[#211F1C] rounded transition-colors"
          title="X (টুইটার)-এ শেয়ার করুন"
        >
          X
        </a>

        {/* Copy Link */}
        <button
          id="share-copy-link-btn"
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F1ECE4] hover:bg-[#DDD6CC]/60 text-[#211F1C] rounded transition-colors cursor-pointer"
          title="লিঙ্ক কপি করুন"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <LinkIcon className="w-3.5 h-3.5" />}
          <span>{copied ? 'কপি হয়েছে' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};
