import React, { useRef } from 'react';
import { Camera, Upload, PlusCircle, Settings, BookOpen, KeyRound, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenAddModal,
  onOpenSettings,
  onOpenProfileModal
}) => {
  const hasApiKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim().length > 5);
  const currentProfile = settings.userProfile || 'Carlos';

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

          {/* Botones de acción principales: Único botón '+' y Ajustes */}
          <div className="flex items-center gap-2">
            {/* Botón Principal: + Nuevo Gasto */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-forest-800 text-[#FAF6ED] hover:bg-forest-900 active:bg-forest-900 font-medium text-xs sm:text-sm border border-forest-900 shadow-sm transition-all duration-150 group"
              title="Registrar nuevo gasto (Foto, Galería o a Mano)"
            >
              <PlusCircle className="w-4 h-4 text-[#D8E6DE] group-hover:rotate-90 transition-transform duration-200" />
              <span className="font-semibold">Nuevo Gasto</span>
            </button>

            {/* Botón: Ajustes (Solo ícono de engranaje compacto) */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-sm border border-ledger-border bg-ledger-card hover:bg-ledger-rule text-ink-700 transition-colors relative"
              title="Configuración y Ajustes"
            >
              <Settings className="w-4 h-4 text-ink-700" />
              {hasApiKey ? (
                <span className="w-2 h-2 rounded-full bg-forest-600 absolute top-1.5 right-1.5" title="API Key conectada" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-leather-600 animate-ping absolute top-1.5 right-1.5" title="Falta API Key de Gemini" />
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
