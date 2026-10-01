import React, { useRef } from 'react';
import { Camera, Upload, PlusCircle, Settings, BookOpen, KeyRound, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onOpenScanner: (file: File) => void;
  onOpenBatchScanner: (files: File[]) => void;
  onOpenManualEntry: () => void;
  onOpenSettings: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenScanner,
  onOpenBatchScanner,
  onOpenManualEntry,
  onOpenSettings,
  onOpenProfileModal
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasApiKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim().length > 5);
  const currentProfile = settings.userProfile || 'Carlos';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (files.length === 1) {
        onOpenScanner(files[0]);
      } else {
        onOpenBatchScanner(files);
      }
      e.target.value = ''; // Reset input so same file can be chosen again
    }
  };

  return (
    <header className="border-b border-ledger-border bg-ledger-paper/95 backdrop-blur-sm sticky top-0 z-30 shadow-ledger-sm">
      {/* Barra superior de estado contable */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Título de la app con estética de libro contable y Perfil Activo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-sm bg-forest-800 text-ledger-bg flex items-center justify-center border border-forest-900 shadow-sm">
                <BookOpen className="w-5 h-5 text-[#E3D9C3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 leading-none">
                    Mis Cuentas
                  </h1>
                  
                  {/* Badge de Perfil y Nube */}
                  <button
                    onClick={onOpenProfileModal}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-ledger-card border border-ledger-border hover:border-forest-700 hover:bg-ledger-rule text-ink-800 transition-colors shadow-xs"
                    title="Cambiar perfil en este dispositivo (Carlos / Yuli)"
                  >
                    <span>{currentProfile === 'Carlos' ? '💼' : currentProfile === 'Yuli' ? '🌸' : '👥'}</span>
                    <span className="font-semibold">Perfil: {currentProfile}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" title="Sincronización Pareja activa" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-ink-500 font-sans tracking-wide mt-1">
                  Libro de gastos & lector de tickets con IA
                </p>
              </div>
            </div>

            {/* Botón de ajustes en móvil */}
            <button
              onClick={onOpenSettings}
              className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-ledger-border bg-ledger-card text-ink-700 hover:bg-ledger-rule transition-colors"
              title="Configuración y API Key"
            >
              {hasApiKey ? (
                <CheckCircle2 className="w-4 h-4 text-forest-700" />
              ) : (
                <AlertCircle className="w-4 h-4 text-leather-600 animate-pulse" />
              )}
              <Settings className="w-4 h-4 text-ink-700" />
            </button>
          </div>

          {/* Botones de acción principales */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Inputs ocultos para cámara y archivo */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,image/heic,image/heif"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/heic,image/heif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Botón: Tomar Foto (Cámara móvil) */}
            <button
              onClick={() => {
                if (!hasApiKey) {
                  onOpenSettings();
                  return;
                }
                cameraInputRef.current?.click();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm bg-forest-800 text-[#FAF6ED] hover:bg-forest-900 active:bg-forest-900 font-medium text-xs sm:text-sm border border-forest-900 shadow-sm transition-all duration-150 group"
              title="Tomar foto de ticket con la cámara"
            >
              <Camera className="w-4 h-4 text-[#D8E6DE] group-hover:scale-110 transition-transform" />
              <span>Tomar Foto</span>
            </button>

            {/* Botón: Subir Tickets (1 o varios a la vez) */}
            <button
              onClick={() => {
                if (!hasApiKey) {
                  onOpenSettings();
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm bg-ledger-card text-forest-900 hover:bg-ledger-rule border border-ledger-border font-medium text-xs sm:text-sm transition-all duration-150"
              title="Subir 1 o varios tickets a la vez desde tu galería"
            >
              <Layers className="w-4 h-4 text-forest-700" />
              <span>Subir Ticket(s)</span>
            </button>

            {/* Botón: Gasto a mano */}
            <button
              onClick={onOpenManualEntry}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm bg-leather-700 text-[#FAF6ED] hover:bg-leather-800 border border-leather-800 font-medium text-xs sm:text-sm transition-all duration-150"
              title="Registrar gasto sin ticket (renta, luz, agua, etc.)"
            >
              <PlusCircle className="w-4 h-4 text-[#F4E1D2]" />
              <span>Gasto a Mano</span>
            </button>

            {/* Botón: Ajustes en escritorio */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-sm border border-ledger-border bg-ledger-card hover:bg-ledger-rule text-ink-700 text-xs sm:text-sm transition-colors"
              title="Configuración de IA y Respaldos"
            >
              <Settings className="w-4 h-4 text-ink-700" />
              <span>Ajustes</span>
              {hasApiKey ? (
                <span className="w-2 h-2 rounded-full bg-forest-600" title="API Key de Gemini conectada" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-leather-600 animate-ping" title="Falta API Key de Gemini" />
              )}
            </button>
          </div>

        </div>

        {/* Notificación tenue si no hay API Key configurada */}
        {!hasApiKey && (
          <div className="mt-2.5 px-3 py-1.5 rounded-sm bg-leather-50 border border-leather-200 text-leather-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-leather-600 shrink-0" />
              <span>Para escanear fotos con IA, ingresa tu clave gratuita de Google Gemini.</span>
            </div>
            <button
              onClick={onOpenSettings}
              className="font-semibold text-leather-800 underline hover:text-leather-900 ml-2 shrink-0"
            >
              Configurar ahora →
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
