import React, { useState, useRef } from 'react';
import { AppSettings, Expense, UserProfile } from '../types';
import { 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  User,
  Cloud,
  Share2,
  ShieldCheck
} from 'lucide-react';
import { exportExpensesToCSV, exportExpensesToJSON, exportParejaExpensesToJSON } from '../services/storageService';
import { getAvailableGeminiModels } from '../services/geminiService';
import { syncParejaWithFirestore, mergeParejaExpenses } from '../services/cloudSyncService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  expenses: Expense[];
  onImportExpenses: (imported: Expense[]) => void;
  onClearExpenses: () => void;
  onExpensesUpdated?: (newExpenses: Expense[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  expenses,
  onImportExpenses,
  onClearExpenses,
  onExpensesUpdated
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [model, setModel] = useState(settings.geminiModel || 'gemini-3.8-flash');
  const [userProfile, setUserProfile] = useState<UserProfile>(settings.userProfile || 'Carlos');
  const [syncCode, setSyncCode] = useState(settings.cloudSync?.syncCode || 'FAMILIA-CY');
  const [firebaseProjectId, setFirebaseProjectId] = useState(settings.cloudSync?.firebaseProjectId || '');
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(Boolean(settings.cloudSync?.enabled));
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parejaFileInputRef = useRef<HTMLInputElement>(null);

  const handleDetectModels = async () => {
    if (!apiKey.trim()) {
      setDetectStatus('Por favor ingresa primero tu API Key para consultar.');
      return;
    }
    setIsDetecting(true);
    setDetectStatus('Consultando modelos habilitados en Google AI Studio...');
    try {
      const models = await getAvailableGeminiModels(apiKey.trim());
      if (models.length > 0) {
        setDetectedModels(models);
        if (!models.includes(model)) {
          setModel(models[0]);
        }
        setDetectStatus(`¡Éxito! Tu clave tiene acceso a: ${models.join(', ')}`);
      } else {
        setDetectStatus('No se encontraron modelos con esta clave. Verifica que sea una clave válida de Google AI Studio.');
      }
    } catch (err: any) {
      setDetectStatus('Error al consultar modelos: ' + err.message);
    } finally {
      setIsDetecting(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      geminiApiKey: apiKey.trim(),
      geminiModel: model.trim(),
      userProfile,
      cloudSync: {
        enabled: cloudSyncEnabled,
        syncCode: syncCode.trim() || 'FAMILIA-CY',
        firebaseProjectId: firebaseProjectId.trim(),
        lastSyncTime: settings.cloudSync?.lastSyncTime,
        syncStatus: 'idle'
      }
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleSyncParejaNow = async () => {
    if (!firebaseProjectId.trim()) {
      setSyncStatusMsg('Ingresa tu Project ID de Firebase para conectar la nube.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Sincronizando gastos de Pareja en Google Firestore...');
    const parejaList = expenses.filter(e => (e.persona || 'Pareja') === 'Pareja');
    const result = await syncParejaWithFirestore(parejaList, {
      ...settings,
      cloudSync: {
        enabled: true,
        syncCode: syncCode.trim() || 'FAMILIA-CY',
        firebaseProjectId: firebaseProjectId.trim()
      }
    });
    setIsSyncing(false);
    setSyncStatusMsg(result.message);
    if (result.success && result.remoteExpenses && onExpensesUpdated) {
      const merged = mergeParejaExpenses(expenses, result.remoteExpenses);
      onExpensesUpdated(merged);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportExpenses(parsed);
          alert(`Se importaron ${parsed.length} asientos contables con éxito.`);
        } else {
          alert('El archivo JSON no tiene un formato válido de lista de gastos.');
        }
      } catch (err) {
        alert('Error al leer el archivo de respaldo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportParejaOnly = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const merged = mergeParejaExpenses(expenses, parsed);
          if (onExpensesUpdated) onExpensesUpdated(merged);
          alert(`Se fusionaron ${parsed.length} gastos de Pareja con éxito. Tus gastos personales no fueron alterados.`);
        } else {
          alert('El archivo no tiene formato válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que deseas vaciar todos los gastos registrados? Esta acción no se puede deshacer a menos que tengas un respaldo guardado.')) {
      onClearExpenses();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-border bg-ledger-header/80">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-forest-800" />
            <h3 className="font-serif font-bold text-ink-900 text-base">
              Ajustes del Cuaderno & IA
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
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-5">
          
          {/* Sección: Perfil de este Dispositivo */}
          <div className="space-y-2.5 pb-3 border-b border-ledger-rule">
            <label className="block text-xs font-semibold text-ink-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-leather-700" />
              <span>Perfil de este Dispositivo</span>
            </label>
            <p className="text-[11px] text-ink-600">
              Define quién utiliza este celular o computadora para mantener la privacidad de los gastos personales:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUserProfile('Carlos')}
                className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all text-center ${
                  userProfile === 'Carlos'
                    ? 'bg-forest-800 text-white border-forest-900 shadow-xs'
                    : 'bg-ledger-card border-ledger-border text-ink-700 hover:bg-ledger-rule'
                }`}
              >
                💼 Carlos
              </button>
              <button
                type="button"
                onClick={() => setUserProfile('Yuli')}
                className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all text-center ${
                  userProfile === 'Yuli'
                    ? 'bg-leather-700 text-white border-leather-800 shadow-xs'
                    : 'bg-ledger-card border-ledger-border text-ink-700 hover:bg-ledger-rule'
                }`}
              >
                🌸 Yuli
              </button>
              <button
                type="button"
                onClick={() => setUserProfile('Todos')}
                className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all text-center ${
                  userProfile === 'Todos'
                    ? 'bg-ink-800 text-white border-ink-900 shadow-xs'
                    : 'bg-ledger-card border-ledger-border text-ink-700 hover:bg-ledger-rule'
                }`}
              >
                👥 Ambos
              </button>
            </div>
            <p className="text-[10px] text-ink-500 italic">
              {userProfile === 'Carlos' 
                ? 'Solo verás tus gastos personales de Carlos y los gastos compartidos de Pareja. Los de Yuli quedan privados.' 
                : userProfile === 'Yuli' 
                ? 'Solo verás tus gastos personales de Yuli y los gastos compartidos de Pareja. Los de Carlos quedan privados.' 
                : 'Modo sin restricciones: muestra todos los registros de todos.'}
            </p>
          </div>

          {/* Sección: Clave de Gemini */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink-800 uppercase tracking-wider">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1 underline"
              >
                <span>Obtener clave gratis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pega aquí tu clave (ej. AIzaSy...)"
                className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm font-mono bg-ledger-paper border border-ledger-border rounded-sm text-ink-900 focus:outline-none focus:border-forest-700"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-1"
                title={showKey ? 'Ocultar' : 'Mostrar'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="bg-[#FAF7EE] p-3 rounded-sm border border-ledger-border text-[11px] text-ink-600 space-y-1">
              <p className="font-semibold text-ink-800">🔒 Privacidad y Gratuidad:</p>
              <p>• Tu clave se almacena únicamente en la memoria local de tu navegador (<code className="font-mono">localStorage</code>).</p>
              <p>• Los modelos Flash de Google Gemini ofrecen capa gratuita sin tarjeta de crédito en <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="underline text-forest-700">ai.google.dev</a>.</p>
            </div>
          </div>

          {/* Sección: Modelo de IA */}
          <div className="space-y-2.5 pt-2 border-t border-ledger-rule">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-forest-800" />
                <span>Modelo Flash de Google Gemini (Serie 3 y 2.5)</span>
              </label>
              
              <button
                type="button"
                onClick={handleDetectModels}
                disabled={isDetecting || !apiKey.trim()}
                className="text-[11px] font-medium text-forest-700 hover:text-forest-900 underline flex items-center gap-1 disabled:opacity-50"
                title="Consultar en vivo los modelos Flash habilitados en tu cuenta de Google"
              >
                <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Verificando...' : 'Detectar modelos de mi clave'}</span>
              </button>
            </div>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700 cursor-pointer font-mono"
            >
              {/* Modelos detectados en vivo si están disponibles */}
              {detectedModels.length > 0 ? (
                detectedModels.map(m => (
                  <option key={m} value={m}>
                    {m} (Habilitado en tu cuenta)
                  </option>
                ))
              ) : (
                <>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recomendado — Actual 2026)</option>
                  <option value="gemini-3.7-flash">gemini-3.7-flash (Serie Gemini 3)</option>
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Serie Gemini 3)</option>
                  <option value="gemini-3-flash">gemini-3-flash (Serie Gemini 3)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Serie Gemini 2.5)</option>
                </>
              )}
            </select>

            {detectStatus && (
              <p className={`text-[11px] ${detectStatus.includes('Éxito') ? 'text-forest-800 font-semibold' : 'text-leather-800'}`}>
                {detectStatus}
              </p>
            )}

            <p className="text-[11px] text-ink-500">
              💡 <strong>Nota sobre versiones:</strong> Google retiró las versiones antiguas 1.5 y 2.0 en favor de la generación actual <strong>Gemini 3</strong> y 2.5.
            </p>
          </div>

          {/* Sección: Sincronización en la Nube (Pareja) */}
          <div className="space-y-3 pt-2 border-t border-ledger-rule">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-ink-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-forest-700" />
                <span>Sincronización de Pareja (Google Firestore)</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cloudSyncEnabled}
                  onChange={(e) => setCloudSyncEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-ledger-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-800"></div>
              </label>
            </div>

            <p className="text-[11px] text-ink-600 leading-relaxed">
              Permite que los gastos marcados como <strong>Pareja</strong> se sincronicen en vivo entre el teléfono de Carlos y el de Yuli.
            </p>

            {cloudSyncEnabled && (
              <div className="space-y-2.5 p-3 bg-forest-50/60 border border-forest-200 rounded-sm">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-700 mb-0.5">
                    Firebase Project ID
                  </label>
                  <input
                    type="text"
                    value={firebaseProjectId}
                    onChange={(e) => setFirebaseProjectId(e.target.value)}
                    placeholder="ej. mis-gastos-pareja-12345"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-ledger-paper border border-ledger-border rounded-xs text-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-700 mb-0.5">
                    Código de Vinculación Familiar (PIN)
                  </label>
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value)}
                    placeholder="FAMILIA-CY"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-ledger-paper border border-ledger-border rounded-xs uppercase tracking-wider font-bold text-ink-900"
                  />
                  <p className="text-[10px] text-ink-500 mt-0.5">Ambos celulares deben tener el mismo código.</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSyncParejaNow}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs bg-forest-800 text-white hover:bg-forest-900 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Pareja Ahora'}</span>
                  </button>

                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-forest-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Consola Firebase</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {syncStatusMsg && (
                  <p className={`text-[11px] font-medium ${syncStatusMsg.includes('exitosa') ? 'text-forest-800' : 'text-leather-800'}`}>
                    {syncStatusMsg}
                  </p>
                )}
              </div>
            )}

            {/* Alternativa sin nube directa: Compartir archivo de Pareja */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-ledger-rule/60">
              <button
                type="button"
                onClick={() => exportParejaExpensesToJSON(expenses)}
                className="flex items-center gap-1 text-xs text-leather-800 hover:underline font-medium"
                title="Descarga solo los gastos de Pareja para enviarlos por WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-leather-700" />
                <span>Exportar solo gastos de Pareja</span>
              </button>

              <input
                ref={parejaFileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportParejaOnly}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => parejaFileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-forest-800 hover:underline font-medium"
              >
                <Upload className="w-3.5 h-3.5 text-forest-700" />
                <span>Fusionar archivo de Pareja</span>
              </button>
            </div>
          </div>

          {/* Sección: Respaldos y Exportación */}
          <div className="space-y-2.5 pt-2 border-t border-ledger-rule">
            <h4 className="text-xs font-semibold text-ink-800 uppercase tracking-wider">
              Gestión de Datos & Respaldos ({expenses.length} registros)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportExpensesToCSV(expenses)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-ledger-card border border-ledger-border rounded-sm text-ink-800 hover:bg-ledger-rule font-medium transition-colors"
                title="Descargar archivo CSV compatible con Excel y Google Sheets"
              >
                <Download className="w-3.5 h-3.5 text-forest-700" />
                <span>Exportar a Excel (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => exportExpensesToJSON(expenses)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-ledger-card border border-ledger-border rounded-sm text-ink-800 hover:bg-ledger-rule font-medium transition-colors"
                title="Descargar archivo de respaldo JSON para migrar de dispositivo"
              >
                <Download className="w-3.5 h-3.5 text-leather-700" />
                <span>Respaldo JSON</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-900 underline"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar desde archivo JSON</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar libro contable</span>
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-ledger-rule flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-700 hover:text-ink-900 border border-ledger-border bg-ledger-card rounded-sm hover:bg-ledger-rule"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#FAF6ED] bg-forest-800 hover:bg-forest-900 rounded-sm border border-forest-900 shadow-sm"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-200" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Ajustes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
