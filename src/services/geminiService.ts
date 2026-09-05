import { EXPENSE_CATEGORIES, ExpenseCategory, GeminiParsedReceipt } from '../types';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Optimiza y comprime una imagen antes de enviarla a la API o guardarla.
 * Utiliza decodificación por hardware con createImageBitmap, conversión de fotos
 * en formato HEIC/HEIF (comunes en Samsung Galaxy y iPhones) y fallbacks con
 * URL.createObjectURL para evitar saturar la memoria RAM en navegadores móviles.
 */
export async function optimizeImage(
  file: File | Blob,
  options: ImageProcessingOptions = {}
): Promise<{ base64Data: string; mimeType: string; dataUrl: string }> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = options;

  let processedBlob: Blob = file;

  // 1. Detectar y convertir fotos en formato HEIC / HEIF
  const isHeic =
    (file instanceof File && (/\.(heic|heif)$/i.test(file.name))) ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';

  if (isHeic) {
    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default || heic2anyModule;
      const conversionResult = await (heic2any as any)({
        blob: file,
        toType: 'image/jpeg',
        quality
      });
      processedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    } catch (heicErr) {
      console.warn('No se pudo convertir HEIC con heic2any, intentando decodificador nativo:', heicErr);
    }
  }

  // 2. Método preferido y de alto rendimiento: createImageBitmap (Hardware decode en Android/Chrome)
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(processedBlob, { imageOrientation: 'from-image' } as any);
      let { width, height } = bitmap;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        try {
          bitmap.close(); // Liberar memoria de GPU
        } catch {}

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(',')[1];
        return { base64Data, mimeType, dataUrl };
      }
    } catch (bitmapErr) {
      console.warn('createImageBitmap no disponible o falló, recurriendo a URL.createObjectURL:', bitmapErr);
    }
  }

  // 3. Fallback con URL.createObjectURL (mucho más ligero y seguro en móviles que FileReader masivo)
  return new Promise((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(processedBlob);
    } catch {
      // Si falla createObjectURL, usar FileReader directamente
      useFileReaderFallback(processedBlob, maxWidth, maxHeight, quality, resolve, reject);
      return;
    }

    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo inicializar el procesador de imagen en el dispositivo'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64Data = dataUrl.split(',')[1];
      resolve({ base64Data, mimeType, dataUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      useFileReaderFallback(processedBlob, maxWidth, maxHeight, quality, resolve, reject);
    };

    img.src = objectUrl;
  });
}

function useFileReaderFallback(
  blob: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  resolve: (val: { base64Data: string; mimeType: string; dataUrl: string }) => void,
  reject: (reason?: any) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrlRaw = e.target?.result as string;
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Data = dataUrl.split(',')[1];
        resolve({ base64Data, mimeType, dataUrl });
        return;
      }
      reject(new Error('No se pudo procesar el lienzo de imagen'));
    };
    img.onerror = () => {
      // Si todo falla, enviar dataUrl cruda si es jpeg o png
      if (dataUrlRaw && dataUrlRaw.includes(',')) {
        const parts = dataUrlRaw.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        resolve({ base64Data: parts[1], mimeType: mime, dataUrl: dataUrlRaw });
        return;
      }
      reject(new Error('Formato de imagen no compatible. Prueba tomando la foto desde la app de cámara normal o seleccionándola desde tu galería.'));
    };
    img.src = dataUrlRaw;
  };
  reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
  reader.readAsDataURL(blob);
}

/**
/**
 * Consulta la API de Google Gemini para obtener la lista de modelos Flash activos
 * habilitados para la clave proporcionada.
 */
export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey || apiKey.trim() === '') return [];
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (data && Array.isArray(data.models)) {
      return data.models
        .filter((m: any) => 
          Array.isArray(m.supportedGenerationMethods) && 
          m.supportedGenerationMethods.includes('generateContent') &&
          m.name && m.name.toLowerCase().includes('flash')
        )
        .map((m: any) => m.name.replace(/^models\//, ''));
    }
  } catch (err) {
    console.warn('No se pudo consultar la lista de modelos de Gemini:', err);
  }
  return [];
}

/**
 * Llama a la API de Google Gemini (Vision) para extraer los datos del ticket.
 */
export async function parseReceiptWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string = 'gemini-3.8-flash'
): Promise<GeminiParsedReceipt> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Falta configurar la API Key de Gemini. Ingresa a "Ajustes" para colocar tu clave gratuita de Google AI Studio (ai.google.dev).'
    );
  }

  // Modelos activos de la serie Gemini 3 y 2.5 (Gemini 1.5 y 2.0 fueron dados de baja por Google)
  const primaryModel = modelName.trim() || 'gemini-3.8-flash';
  const candidateFallbacks = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3-flash',
    'gemini-2.5-flash'
  ];
  const modelsToTry = [
    primaryModel,
    ...candidateFallbacks.filter(m => m !== primaryModel)
  ];

  const systemPrompt = `Eres un asistente contable experto en digitalización de comprobantes, recibos y tickets de compra.
Analiza con máxima precisión la imagen del ticket proporcionada y extrae los siguientes datos:
1. "comercio": Nombre comercial de la tienda, negocio, restaurante o proveedor (ej. "OXXO", "Walmart", "Gasolinera Pemex", "Uber", "CFE").
2. "fecha": Fecha de la compra o emisión en formato EXACTO "YYYY-MM-DD". Si el año no es visible, usa el año actual (${new Date().getFullYear()}). Si no hay fecha legible, usa la fecha de hoy.
3. "total": Monto final total pagado como número flotante (ej. 145.50). Si hay propina o impuestos incluidos en el gran total pagado, toma el valor final más alto que represente el cargo total.
4. "categoria": Debe ser EXACTAMENTE UNA de las siguientes opciones válidas:
${EXPENSE_CATEGORIES.map(c => `   - "${c}"`).join('\n')}
   * Guía para categorizar:
     - "Comida": supermercados, restaurantes, cafeterías, tiendas de abarrotes, delivery de comida.
     - "Transporte": taxis, Uber, Didi, metro, camión, peajes.
     - "Gasolina": estaciones de combustible.
     - "Compras": ropa, tecnología, papelería, ferretería, artículos personales o del hogar.
     - "Servicios": telefonía, internet, suscripciones, mantenimiento, comisiones.
     - "Luz": recibos de electricidad (ej. CFE).
     - "Agua": recibos de agua potable.
     - "Renta": arrendamiento de vivienda o local.
     - "Hospedaje": hoteles, Airbnb.
     - "Entretenimiento": cine, eventos, salidas de ocio.
     - "Otros": cualquier gasto que no encaje en las categorías anteriores.
5. "moneda": "MXN" o "USD". Si el ticket está en pesos mexicanos (símbolo $ sin especificar USD, o menciona IVA, RFC, pesos), usa "MXN". Si el comprobante indica dólares estadounidenses o es de un comercio de EE.UU., usa "USD".
6. "metodoPago": "Efectivo" | "Tarjeta de Crédito" | "Tarjeta de Débito" | "Transferencia". Analiza si el comprobante menciona haber sido pagado con tarjeta (ej. "VISA", "MASTERCARD", "AMEX", "TARJETA", "T.C.", "T.D.", "BANCOMER", "BBVA", "BANAMEX", "VOUCHER") o en efectivo. Si no se puede deducir, usa "Efectivo".
7. "ultimos4Digitos": Si el comprobante o voucher muestra los últimos 4 dígitos de la tarjeta (ej. "**** 4582", "CTA: 1234", "TERM: 9876"), extrae únicamente esos 4 dígitos como string (ej. "4582"). Si el pago fue en efectivo o no se aprecian los 4 dígitos, usa null.

REGLAS OBLIGATORIAS:
- NUNCA dejes ningún campo vacío o nulo (excepto ultimos4Digitos si no aplica tarjeta). Si algún dato está parcialmente borroso, realiza tu mejor estimación razonable basada en el contexto.
- Si la imagen NO es un ticket, está completamente negra, o es totalmente ilegible (no se distingue ningún texto o cifra), devuelve el JSON con el campo "ilegitimo": true o "motivo_error": "explicacion".
- Responde ÚNICAMENTE con el objeto JSON puro sin introducciones ni comentarios adicionales.`;

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const errMsg = errorData?.error?.message || response.statusText;

        if (status === 400 || status === 403) {
          if (errMsg.toLowerCase().includes('api key') || errMsg.toLowerCase().includes('permission')) {
            throw new Error(`Clave de API inválida o sin permisos: ${errMsg}. Verifica tu clave en Ajustes.`);
          }
        }
        
        // Si el modelo específico no fue encontrado (404), intentamos el siguiente modelo en la lista de fallback
        if (status === 404) {
          console.warn(`Modelo ${currentModel} no disponible (404), probando siguiente modelo...`);
          lastError = new Error(`El modelo ${currentModel} no está disponible actualmente.`);
          continue;
        }

        throw new Error(`Error de Gemini (${status}): ${errMsg}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('La IA no devolvió ninguna respuesta legible.');
      }

      // Limpiar posibles bloques ```json ... ``` si vinieran incluidos
      let cleanedJson = rawText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedJson);

      if (parsed.ilegitimo || parsed.motivo_error) {
        throw new Error(
          parsed.motivo_error ||
          'El comprobante no parece ser un ticket legible. Podría estar muy borroso, mal iluminado o desgastado. Intenta tomar una foto más nítida o agrega el gasto a mano.'
        );
      }

      // Validar y normalizar campos
      const comercio = (parsed.comercio && String(parsed.comercio).trim()) || 'Comercio General';
      
      let fecha = parsed.fecha;
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        // Generar fecha de hoy si no vino válida
        const today = new Date();
        fecha = today.toISOString().slice(0, 10);
      }

      let total = parseFloat(parsed.total);
      if (isNaN(total) || total < 0) {
        total = 0.0;
      }

      let categoria = parsed.categoria as ExpenseCategory;
      if (!EXPENSE_CATEGORIES.includes(categoria)) {
        categoria = 'Otros';
      }

      let moneda = (parsed.moneda || 'MXN').toUpperCase();
      if (moneda !== 'MXN' && moneda !== 'USD') {
        moneda = 'MXN';
      }

      let metodoPago: any = 'Efectivo';
      if (parsed.metodoPago && ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia'].includes(parsed.metodoPago)) {
        metodoPago = parsed.metodoPago;
      } else if (parsed.ultimos4Digitos && String(parsed.ultimos4Digitos).trim().length === 4) {
        metodoPago = 'Tarjeta de Crédito';
      }

      let ultimos4Digitos: string | undefined = undefined;
      if (parsed.ultimos4Digitos) {
        const digits = String(parsed.ultimos4Digitos).replace(/\D/g, '');
        if (digits.length >= 4) {
          ultimos4Digitos = digits.slice(-4);
        }
      }

      return {
        comercio,
        fecha,
        total,
        categoria,
        moneda: moneda as 'MXN' | 'USD',
        metodoPago,
        ultimos4Digitos
      };
    } catch (err: any) {
      lastError = err;
      // Si el error es de autenticación o clave inválida, lanzar de inmediato sin probar otros
      if (err.message && (err.message.includes('API') || err.message.includes('permisos') || err.message.includes('403'))) {
        throw err;
      }
      console.warn(`Intento con ${currentModel} falló:`, err.message);
    }
  }

  throw new Error(
    `No se pudo procesar con los modelos intentados (${modelsToTry.slice(0, 3).join(', ')}). ${lastError?.message || 'Verifica tu API Key en Ajustes.'}`
  );
}
