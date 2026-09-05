import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, GeminiParsedReceipt } from '../types';
import { optimizeImage, parseReceiptWithGemini } from '../services/geminiService';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  RotateCw, 
  Edit3, 
  Camera, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ScannerModalProps {
  file: File | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (extractedData: GeminiParsedReceipt, photoDataUrl: string) => void;
  onManualWithPhoto: (photoDataUrl: string) => void;
  onSelectNewPhoto: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  file,
  settings,
  isOpen,
  onClose,
  onScanSuccess,
  onManualWithPhoto,
  onSelectNewPhoto
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastBase64Data, setLastBase64Data] = useState<string | null>(null);
  const [lastMimeType, setLastMimeType] = useState<string>('image/jpeg');

  useEffect(() => {
    if (isOpen && file) {
      processImageFile(file);
    } else if (!isOpen) {
      setPhotoPreview(null);
      setErrorMessage(null);
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [isOpen, file]);

  const processImageFile = async (imageFile: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Optimizando y ajustando nitidez del comprobante...');

    // Mostrar previsualización instantánea en el dispositivo
    try {
      const immediateUrl = URL.createObjectURL(imageFile);
      setPhotoPreview(immediateUrl);
    } catch {}

    try {
      // 1. Redimensionar y optimizar para OCR rápido
      const { base64Data, mimeType, dataUrl } = await optimizeImage(imageFile, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85
      });

      setPhotoPreview(dataUrl);
      setLastBase64Data(base64Data);
      setLastMimeType(mimeType);

      // 2. Enviar a Gemini Vision
      setProcessingStep('Analizando ticket con IA de Google Gemini...');
      
      const parsedReceipt = await parseReceiptWithGemini(
        base64Data,
        mimeType,
        settings.geminiApiKey,
        settings.geminiModel
      );

      setProcessingStep('¡Datos extraídos con éxito!');
      
      // Breve pausa para dar retroalimentación visual al usuario
      setTimeout(() => {
        setIsProcessing(false);
        onScanSuccess(parsedReceipt, dataUrl);
      }, 400);

    } catch (err: any) {
      console.error('Error al procesar ticket con IA:', err);
      setIsProcessing(false);
      setErrorMessage(
        err.message || 
        'No pudimos leer los datos de este ticket. Asegúrate de que la foto tenga buena luz y no esté movida.'
      );
    }
  };

  const handleRetry = () => {
    if (file) {
      processImageFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/60 backdrop-blur-xs">
      <div 
        className="bg-ledger-paper border border-ledger-border rounded-sm shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Barra superior de modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-border bg-ledger-header/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest-800" />
            <h3 className="font-serif font-bold text-ink-900 text-base">
              Lector Inteligente de Tickets
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ledger-rule transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Vista previa de la foto del ticket */}
          <div className="relative bg-[#EDE7DA] border border-ledger-border rounded-sm overflow-hidden flex items-center justify-center min-h-[220px] max-h-[340px]">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Ticket capturado"
                className="w-full h-full object-contain max-h-[340px]"
              />
            ) : (
              <div className="text-center p-6 text-ink-400">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Cargando foto...</p>
              </div>
            )}

            {/* Overlay de procesamiento activo */}
            {isProcessing && (
              <div className="absolute inset-0 bg-forest-900/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center text-[#FAF6ED]">
                <div className="w-12 h-12 border-3 border-forest-200 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="font-serif text-base font-semibold">
                  Leyendo comprobante
                </p>
                <p className="text-xs text-forest-100 mt-1 max-w-xs animate-pulse">
                  {processingStep}
                </p>
              </div>
            )}
          </div>

          {/* Cuadro de Error Claro y Didáctico */}
          {errorMessage && !isProcessing && (
            <div className="p-3.5 bg-[#FAF0EC] border border-[#EACEC3] rounded-sm text-xs text-[#6F3823] space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-leather-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-leather-800 text-xs sm:text-sm">
                    No se pudieron leer los datos automáticamente
                  </p>
                  <p className="mt-1 leading-relaxed text-ink-700">
                    {errorMessage}
                  </p>
                </div>
              </div>

              {/* Explicación de causas comunes */}
              <div className="border-t border-[#E8D4CB] pt-2 mt-2">
                <p className="font-medium text-ink-800 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-leather-600" />
                  ¿Por qué suele ocurrir esto?
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-ink-600 pl-1 mt-1 text-[11px]">
                  <li>Foto borrosa, con reflejo excesivo o poca luz.</li>
                  <li>Ticket térmico muy tenue, arrugado o cortado.</li>
                  <li>La clave de API de Gemini no se ha ingresado o expiró.</li>
                </ul>
              </div>

              {/* Botones de acción alternativa */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-ledger-paper border border-leather-500 rounded-sm text-leather-800 font-medium hover:bg-leather-50 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reintentar lectura</span>
                </button>

                <button
                  onClick={onSelectNewPhoto}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-forest-800 text-[#FAF6ED] rounded-sm font-medium hover:bg-forest-900 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tomar otra foto</span>
                </button>

                {photoPreview && (
                  <button
                    onClick={() => onManualWithPhoto(photoPreview)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-leather-700 text-[#FAF6ED] rounded-sm font-medium hover:bg-leather-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Llenar a mano</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Consejos para una lectura perfecta */}
          {!errorMessage && !isProcessing && (
            <div className="bg-ledger-card/60 p-3 rounded-sm border border-ledger-border text-[11px] text-ink-600 space-y-1">
              <p className="font-medium text-ink-800">💡 Consejos para escanear tickets:</p>
              <p>• Coloca el ticket sobre una superficie plana con buena iluminación.</p>
              <p>• Asegúrate de que el nombre del negocio, la fecha y el gran total sean visibles.</p>
            </div>
          )}

        </div>

        {/* Pie de modal */}
        <div className="px-4 py-3 border-t border-ledger-border bg-ledger-header/50 flex justify-end">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs text-ink-700 hover:text-ink-900 border border-ledger-border bg-ledger-paper rounded-sm hover:bg-ledger-rule disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
