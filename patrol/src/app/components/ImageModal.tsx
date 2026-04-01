/* imagemodal */

import { X, Image as ImageIcon } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <ImageIcon className="size-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">이미지 보기</h3>
          </div>
          <button
            onClick={onClose}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all duration-300 hover:scale-110"
          >
            <X className="size-6 text-slate-600" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto p-6">
          <ImageWithFallback
            src={imageUrl}
            alt="Log Image"
            className="w-full h-auto rounded-2xl shadow-xl"
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}