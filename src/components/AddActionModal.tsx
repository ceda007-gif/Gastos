import React, { useRef } from 'react';
import { Camera, Layers, PlusCircle, X, Sparkles } from 'lucide-react';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onSelectPhoto: (file: File) => void;
  onSelectBatch: (files: File[]) => void;
  onSelectManual: () => void;
}

export const AddActionModal: React.FC<AddActionModalProps> = ({
  isOpen,
  onClose,
  hasApiKey,
  onOpenSettings,
  onSelectPhoto,
  onSelectBatch,
  onSelectManual
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = '';
      onClose();
      onSelectPhoto(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      e.target.value = '';
      onClose();
      if (files.length === 1) {
        onSelectPhoto(files[0]);
      } else {
        onSelectBatch(files);
      }
    }
  };

  const handleTakePhotoClick = () => {
    if (!hasApiKey) {
      onClose();
      onOpenSettings();
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    if (!hasApiKey) {
      onClose();
      onOpenSettings();
      return;
    }
    galleryInputRef.current?.click();
  };

  const handleManualClick = () => {
    onClose();
    onSelectManual();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Inputs invisibles */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={handleGalleryChange}
      />

      {/* Contenedor del Modal */}
      <div 
        className="w-full max-w-sm bg-ledger-paper border border-ledger-border rounded-t-2xl sm:rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ledger-border bg-ledger-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-forest-800 text-[#FAF6ED] flex items-center justify-center shadow-xs">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-ink-900 text-base">
              Registrar Nuevo Gasto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ledger-rule transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opciones */}
        <div className="p-4 space-y-3">
          {/* Opción 1: Tomar Foto */}
          <button
            onClick={handleTakePhotoClick}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-lg border border-forest-200 bg-forest-50/70 hover:bg-forest-100 text-left transition-all group"
          >
            <div className="w-11 h-11 rounded-lg bg-forest-800 text-[#FAF6ED] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5 text-[#E0EFE7]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-forest-900 text-sm">Tomar Foto</span>
                <span className="text-[10px] bg-forest-200/80 text-forest-900 px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-forest-700" /> IA
                </span>
              </div>
              <p className="text-xs text-forest-700/80 mt-0.5 leading-snug">
                Abre la cámara para capturar y digitalizar un ticket individual.
              </p>
            </div>
          </button>

          {/* Opción 2: Subir Ticket(s) */}
          <button
            onClick={handleGalleryClick}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-lg border border-ledger-border bg-ledger-card hover:bg-ledger-rule/80 text-left transition-all group"
          >
            <div className="w-11 h-11 rounded-lg bg-forest-700/10 text-forest-800 border border-forest-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-forest-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-ink-900 text-sm">Subir Ticket(s)</span>
                <span className="text-[10px] bg-ledger-border text-ink-700 px-1.5 py-0.5 rounded-xs font-semibold">
                  Galería / Lote
                </span>
              </div>
              <p className="text-xs text-ink-600 mt-0.5 leading-snug">
                Selecciona 1 a 3 comprobantes de tu galería.
              </p>
            </div>
          </button>

          {/* Opción 3: Gasto a Mano */}
          <button
            onClick={handleManualClick}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-lg border border-leather-200 bg-leather-50/60 hover:bg-leather-100 text-left transition-all group"
          >
            <div className="w-11 h-11 rounded-lg bg-leather-700 text-[#FAF6ED] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5 text-[#F5E6DC]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-leather-900 text-sm block">Gasto a Mano</span>
              <p className="text-xs text-leather-700/80 mt-0.5 leading-snug">
                Registra rentas, servicios o gastos sin comprobante físico.
              </p>
            </div>
          </button>
        </div>

        {/* Pie con botón cancelar */}
        <div className="p-3 bg-ledger-header/60 border-t border-ledger-border text-center">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-ink-600 hover:text-ink-900 rounded-sm hover:bg-ledger-paper transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
