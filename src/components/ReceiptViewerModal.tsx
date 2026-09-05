import React from 'react';
import { X, Download } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  merchantName: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  merchantName
}) => {
  if (!isOpen || !photoUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `ticket_${merchantName.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/75 backdrop-blur-xs">
      <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-border bg-ledger-header/80">
          <h3 className="font-serif font-bold text-ink-900 text-sm truncate">
            Comprobante: {merchantName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1 rounded-sm text-ink-600 hover:text-ink-900 hover:bg-ledger-rule"
              title="Descargar imagen"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-sm text-ink-600 hover:text-ink-900 hover:bg-ledger-rule"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Imagen */}
        <div className="p-3 bg-[#E8E1D2] overflow-auto flex items-center justify-center max-h-[75vh]">
          <img
            src={photoUrl}
            alt={`Comprobante de ${merchantName}`}
            className="max-w-full max-h-[70vh] object-contain rounded-xs shadow-sm border border-ledger-border"
          />
        </div>

        {/* Pie */}
        <div className="px-4 py-2 border-t border-ledger-border bg-ledger-header/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-ink-700 hover:text-ink-900 border border-ledger-border bg-ledger-paper rounded-sm hover:bg-ledger-rule"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
