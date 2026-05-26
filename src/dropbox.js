const APP_KEY      = import.meta.env.VITE_DROPBOX_APP_KEY
const APP_SECRET   = import.meta.env.VITE_DROPBOX_APP_SECRET
const REFRESH_TOKEN = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken
  }

  // Exchange refresh token for a fresh access token
  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${APP_KEY}:${APP_SECRET}`),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh token')

  cachedToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000
  return cachedToken
}

// List all folders in the main client directory
export async function listClientFolders(path = '/HBCL First Initial Appointment Borrower') {
  const token = await getAccessToken()
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      recursive: false,
      include_media_info: false,
      include_deleted: false,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_summary || 'Failed to list folders')
  return data.entries.filter(e => e['.tag'] === 'folder')
}

// List all files inside a client folder
export async function listFilesInFolder(folderPath) {
  const token = await getAccessToken()
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: folderPath,
      recursive: false,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_summary || 'Failed to list files')
  return data.entries.filter(e => e['.tag'] === 'file' && e.name.toLowerCase().endsWith('.pdf'))
}

// Get a temporary download link for a file
export async function getFileLink(filePath) {
  const token = await getAccessToken()
  const res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_summary || 'Failed to get file link')
  return data.link
}

// Download a file as base64 for AI processing
export async function downloadFileAsBase64(filePath) {
  const token = await getAccessToken()
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path: filePath }),
    },
  })
  if (!res.ok) throw new Error('Failed to download file')
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
