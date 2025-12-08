# 🌱 Plant Monitor – Frontend

Frontend del sistema **Plant Monitor**, encargado de visualizar en tiempo real el estado de las plantas IoT (ESP32), mostrar métricas ambientales, historial de datos y permitir acciones como el riego remoto.

🔗 Repositorio: https://github.com/Lu1sEnriquez/plant-monitor

---

## 🧠 Descripción General

Este frontend consume información proveniente del **backend** mediante APIs REST y comunicación en tiempo real, mostrando:

- Índice de Salud General (ESI)
- Temperatura
- Humedad del suelo
- Humedad del aire
- Intensidad lumínica
- Calidad de datos IoT
- Historial ambiental y análisis semanal

Cada planta se identifica por un **Plant ID único**, el cual debe coincidir con el configurado en el ESP32 y el backend.

---

## ⚙️ Variables de Entorno

Crea un archivo llamado **`.env.local`** (o `.env` según tu configuración) basándote en el siguiente template.

### 📄 `.env.example`

```env
# ===============================
# FRONTEND CONFIGURATION
# ===============================

# URL del backend (Spring Boot)
NEXT_PUBLIC_API_URL=http://localhost:8080

# WebSocket / tiempo real (si aplica)
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Identificador de entorno
NEXT_PUBLIC_APP_ENV=development

# Tiempo de refresco de datos (ms)
NEXT_PUBLIC_REFRESH_INTERVAL=5000
```

🔴 **Nota importante:**
- Estas variables **NO deben contener credenciales sensibles**
- El frontend **no se conecta directamente a InfluxDB ni HiveMQ**

---

## 🔗 Relación con Backend y Plantas

Para que el sistema funcione correctamente:

- El **Plant ID** debe ser el mismo en:
  - ESP32 (firmware)
  - Backend (MQTT + DB)
  - Frontend (ruta o selector de planta)

Ejemplo:
```
Planta123
```

---

## 🚀 Instalación y Ejecución

### 1️⃣ Instalar dependencias

```bash
npm install
# o
npm install --legacy-peer-deps
```

### 2️⃣ Ejecutar en desarrollo

```bash
npm run dev
```

El frontend quedará disponible en:

```
http://localhost:3000
```

---

## 🌐 Despliegue

El proyecto está preparado para desplegarse en **Vercel**.

Asegúrate de configurar las variables de entorno en Vercel usando los mismos nombres del `.env.example`.

---

## ✅ Buenas Prácticas

- ✅ No subir archivos `.env` al repositorio
- ✅ Mantener sincronizado el Plant ID entre sistemas
- ✅ Verificar conexión backend antes de pruebas

---

## 🛠️ Tecnologías

- Next.js
- React
- Tailwind / UI Components
- WebSockets / Fetch API

---

## 📞 Soporte

Si no se muestran datos:

- Verifica que el backend esté activo
- Confirma que el Plant ID exista
- Revisa la URL configurada en `NEXT_PUBLIC_API_URL`

---

🌱 **Plant Monitor Frontend**
Sistema de visualización IoT para monitoreo inteligente de plantas

