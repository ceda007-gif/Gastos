import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Check, User, ShieldCheck, HeartHandshake } from 'lucide-react';

interface ProfileSelectorModalProps {
  isOpen: boolean;
  currentProfile: UserProfile;
  onClose: () => void;
  onSelectProfile: (profile: UserProfile) => void;
}

export const ProfileSelectorModal: React.FC<ProfileSelectorModalProps> = ({
  isOpen,
  currentProfile,
  onClose,
  onSelectProfile
}) => {
  const [selected, setSelected] = useState<UserProfile>(currentProfile);

  if (!isOpen) return null;

  const handleSave = () => {
    onSelectProfile(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-border bg-ledger-header/80">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-forest-800" />
            <h3 className="font-serif font-bold text-ink-900 text-base">
              ¿Quién usa este dispositivo?
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
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-xs text-ink-600 leading-relaxed">
            Selecciona tu perfil. La app mantendrá tus gastos personales completamente privados y solo compartirá con tu pareja la sección de gastos comunes:
          </p>

          <div className="space-y-2.5">
            {/* Tarjeta Carlos */}
            <div
              onClick={() => setSelected('Carlos')}
              className={`p-3.5 rounded-sm border cursor-pointer transition-all flex items-start gap-3 ${
                selected === 'Carlos'
                  ? 'border-forest-800 bg-forest-50/70 shadow-xs'
                  : 'border-ledger-border bg-ledger-card hover:bg-ledger-rule'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base ${
                selected === 'Carlos' ? 'bg-forest-800 text-white' : 'bg-ledger-rule text-ink-700'
              }`}>
                💼
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-ink-900">Carlos</h4>
                  {selected === 'Carlos' && (
                    <Check className="w-4 h-4 text-forest-800" />
                  )}
                </div>
                <p className="text-[11px] text-ink-600 mt-0.5">
                  Verás tus gastos de <strong>Carlos</strong> + los compartidos de <strong>Pareja</strong>. Los gastos de Yuli quedan privados.
                </p>
              </div>
            </div>

            {/* Tarjeta Yuli */}
            <div
              onClick={() => setSelected('Yuli')}
              className={`p-3.5 rounded-sm border cursor-pointer transition-all flex items-start gap-3 ${
                selected === 'Yuli'
                  ? 'border-leather-700 bg-leather-50/70 shadow-xs'
                  : 'border-ledger-border bg-ledger-card hover:bg-ledger-rule'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base ${
                selected === 'Yuli' ? 'bg-leather-700 text-white' : 'bg-ledger-rule text-ink-700'
              }`}>
                🌸
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-ink-900">Yuli</h4>
                  {selected === 'Yuli' && (
                    <Check className="w-4 h-4 text-leather-700" />
                  )}
                </div>
                <p className="text-[11px] text-ink-600 mt-0.5">
                  Verás tus gastos de <strong>Yuli</strong> + los compartidos de <strong>Pareja</strong>. Los gastos de Carlos quedan privados.
                </p>
              </div>
            </div>

            {/* Tarjeta Todos */}
            <div
              onClick={() => setSelected('Todos')}
              className={`p-3.5 rounded-sm border cursor-pointer transition-all flex items-start gap-3 ${
                selected === 'Todos'
                  ? 'border-ink-800 bg-ink-50 shadow-xs'
                  : 'border-ledger-border bg-ledger-card hover:bg-ledger-rule'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base ${
                selected === 'Todos' ? 'bg-ink-800 text-white' : 'bg-ledger-rule text-ink-700'
              }`}>
                👥
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-ink-900">Ambos (Libro Completo)</h4>
                  {selected === 'Todos' && (
                    <Check className="w-4 h-4 text-ink-800" />
                  )}
                </div>
                <p className="text-[11px] text-ink-600 mt-0.5">
                  Vista conjunta sin restricciones para revisar todos los números de ambos.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm text-[11px] text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Esta preferencia se guarda únicamente en este celular o computadora.</span>
          </div>

          {/* Botones */}
          <div className="pt-2 border-t border-ledger-rule flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-700 hover:text-ink-900 border border-ledger-border bg-ledger-card rounded-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 rounded-sm shadow-sm"
            >
              Guardar Perfil
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
