# Meta Ads Dashboard

Aplicación web desarrollada con React y Vite para visualizar en tiempo real las campañas activas de Meta Ads (Facebook/Instagram).

## Características

- Visualización en tiempo real de campañas activas
- Métricas detalladas por campaña:
  - Costo por resultado (ventas, mensajes, leads)
  - Presupuesto (diario o total)
  - Gasto consumido
  - Presupuesto restante
  - Alcance
  - Número de impresiones
- Actualización automática cada 30 segundos
- Interfaz moderna y responsiva
- Soporte para múltiples cuentas publicitarias

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Access Token de Meta Marketing API

## Instalación

1. Navega al directorio del proyecto:
```bash
cd meta-ads-dashboard
```

2. Instala las dependencias:
```bash
npm install
```

## Obtener Access Token de Meta

1. Ve a [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Selecciona tu aplicación de Facebook
3. Genera un token con los siguientes permisos:
   - `ads_read`
   - `ads_management`
4. Copia el Access Token generado

**Nota:** Para uso en producción, deberás crear un Access Token de larga duración.

## Uso

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre tu navegador en `http://localhost:5173`

3. Ingresa tu Access Token de Meta en el formulario

4. Selecciona la cuenta publicitaria que deseas monitorear

5. Visualiza tus campañas activas con métricas en tiempo real

## Estructura del Proyecto

```
meta-ads-dashboard/
├── src/
│   ├── components/
│   │   ├── ApiKeyInput.jsx          # Componente para ingresar el Access Token
│   │   ├── ApiKeyInput.css
│   │   ├── CampaignDashboard.jsx    # Dashboard principal de campañas
│   │   └── CampaignDashboard.css
│   ├── services/
│   │   └── metaAdsApi.js            # Servicio para interactuar con Meta API
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
└── README.md
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## Tecnologías Utilizadas

- React 18
- Vite
- Axios
- Meta Marketing API (Graph API v21.0)

## Consideraciones de Seguridad

- **Nunca** compartas tu Access Token públicamente
- No commites el Access Token en el código fuente
- Utiliza variables de entorno para tokens en producción
- Considera implementar un backend proxy para manejar las llamadas a la API

## Limitaciones

- Los Access Tokens de corta duración expiran después de 1-2 horas
- La API de Meta tiene límites de tasa de solicitudes
- Algunas métricas pueden tener un retraso de hasta 48 horas

## Próximas Mejoras

- Persistencia del Access Token (con seguridad)
- Exportación de datos a CSV/Excel
- Gráficos y visualizaciones avanzadas
- Comparación de periodos de tiempo
- Notificaciones de presupuesto
- Modo oscuro

## Licencia

MIT
