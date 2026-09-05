# Mis Cuentas — Control de Gastos & Cuaderno Contable con IA

Aplicación web para el control de gastos personales y de negocios con escaneo inteligente de tickets y comprobantes mediante la API de Google Gemini (Vision), registro manual de servicios periódicos (renta, luz, agua), filtros mensuales, desglose visual por categorías y monedas separadas (MXN / USD), y estética de libro contable tradicional.

---

## 🌟 Características Principales

1. **Lectura Inteligente de Tickets con IA**:
   - Captura directa con la cámara de tu smartphone (`capture="environment"`) o subida de fotografías guardadas.
   - Envío optimizado a **Google Gemini** (`gemini-2.5-flash`, `gemini-2.0-flash` o `gemini-1.5-flash`).
   - Extracción estructurada: **Comercio**, **Fecha**, **Total**, **Categoría** y **Moneda (MXN / USD)**.
   - Diagnóstico claro y amigable en caso de fotos borrosas o tickets desgastados, con alternativas directas para reintentar o llenar a mano.

2. **Registro Manual Ágil**:
   - Registro para gastos sin comprobante físico (arrendamiento, recibos de agua, CFE, transferencias, etc.).
   - Edición y eliminación con confirmación.

3. **Multimoneda Limpia y Sin Mezclas**:
   - Totales separados para **Pesos Mexicanos (MXN)** y **Dólares (USD)**.
   - Desgloses por categoría y por mes filtrables por divisa.

4. **Diseño de Libro Contable Tradicional**:
   - Estética inspirada en cuadernos de contabilidad física (tonos papel marfil `#F8F6F0`, verde bosque oscuro `#1B3B2B`, detalles cuero/tierra `#8C5A35`).
   - Tipografía serif elegante (`Playfair Display`), datos numéricos precisos (`Plus Jakarta Sans` y `JetBrains Mono`) y líneas divisorias tenues tipo renglón.
   - Barra flotante inferior para captura rápida desde el celular.

5. **Privacidad y Persistencia 100% Local**:
   - Todos los asientos contables y fotos se guardan en el `localStorage` del navegador.
   - Sin servidores externos ni bases de datos de terceros.
   - Exportación de reportes a **Excel (CSV con codificación UTF-8)** y copias de seguridad en **JSON**.

---

## 🚀 Cómo Ejecutar la Aplicación

El servidor de desarrollo ya está corriendo en:
- **Local:** `http://localhost:5173/`

Para iniciarlo manualmente en cualquier momento:
```bash
cd c:\Users\Guest\.gemini\antigravity\Apps\mis-cuentas
npm run dev
```

Para compilar a producción:
```bash
npm run build
```

---

## 🔑 Configuración de la API Key de Google Gemini (Gratis)

1. Ingresa a [Google AI Studio (ai.google.dev)](https://aistudio.google.com/app/apikey).
2. Inicia sesión con tu cuenta de Google y genera tu API Key (es gratuita y no requiere tarjeta de crédito para los modelos Flash).
3. En la app "Mis Cuentas", haz clic en **Ajustes** (ícono de engrane) en la esquina superior derecha.
4. Pega tu API Key y haz clic en **Guardar Ajustes**. Tu clave quedará guardada de forma segura en el almacenamiento local de tu navegador.
