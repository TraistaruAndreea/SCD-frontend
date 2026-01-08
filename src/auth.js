import axios from 'axios';

const KEYCLOAK_BASE = 'http://localhost:8180';
const REALM = 'ktor_realm';
const CLIENT_ID = 'ktor-client';

let token = localStorage.getItem('kc_token') || null;
let refreshToken = localStorage.getItem('kc_refresh_token') || null;
let tokenParsed = null;

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  } catch (e) {
    return atob(str);
  }
}

function parseToken(t) {
  if (!t) return null;
  try {
    const payload = t.split('.')[1];
    return JSON.parse(base64UrlDecode(payload));
  } catch (e) {
    return null;
  }
}

async function login(username, password) {
  const url = `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', CLIENT_ID);
  params.append('username', username);
  params.append('password', password);

  const res = await axios.post(url, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  token = res.data.access_token;
  refreshToken = res.data.refresh_token;
  tokenParsed = parseToken(token);

  localStorage.setItem('kc_token', token);
  localStorage.setItem('kc_refresh_token', refreshToken);

  return res.data;
}

function getRefreshToken() {
  if (!refreshToken) {
    refreshToken = localStorage.getItem('kc_refresh_token') || null;
  }
  return refreshToken;
}

async function refreshAccessToken() {
  const rt = getRefreshToken();
  if (!rt) throw new Error('Missing refresh token');

  const url = `${KEYCLOAK_BASE}/realms/${REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', CLIENT_ID);
  params.append('refresh_token', rt);

  const res = await axios.post(url, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  token = res.data.access_token;
  refreshToken = res.data.refresh_token || rt;
  tokenParsed = parseToken(token);

  localStorage.setItem('kc_token', token);
  localStorage.setItem('kc_refresh_token', refreshToken);

  return res.data;
}

function logout() {
  token = null;
  refreshToken = null;
  tokenParsed = null;
  localStorage.removeItem('kc_token');
  localStorage.removeItem('kc_refresh_token');
  window.location.reload();
}

function getToken() {
  if (!token) {
    token = localStorage.getItem('kc_token');
    if (token) tokenParsed = parseToken(token);
  }
  return token;
}

function getUsername() {
  return (tokenParsed && tokenParsed.preferred_username) || null;
}

function getRoles() {
  return (tokenParsed && tokenParsed.realm_access && tokenParsed.realm_access.roles) || [];
}

function setAccessToken(accessToken) {
  if (!accessToken || String(accessToken).trim() === '') {
    throw new Error('Missing access token');
  }
  token = String(accessToken).trim();
  tokenParsed = parseToken(token);
  localStorage.setItem('kc_token', token);
  // refresh token is unknown when user pastes only access token
  localStorage.removeItem('kc_refresh_token');
}

function getTokenInfo() {
  const t = getToken();
  const parsed = tokenParsed || parseToken(t);
  if (!t || !parsed) return null;
  return {
    preferred_username: parsed.preferred_username,
    aud: parsed.aud,
    azp: parsed.azp,
    iss: parsed.iss,
    exp: parsed.exp
  };
}

export default {
  login,
  refreshAccessToken,
  logout,
  getToken,
  getRefreshToken,
  setAccessToken,
  getTokenInfo,
  getUsername,
  getRoles
};
