const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyYydScIHau6murFh_CYSpn3qOqZg-AqiTktmy_wo1Ru9WvvGeW_kUIj6_JC6Mz80mw/exec';

export default async function handler(req, res) {
  try {
    const response = await fetch(`${GOOGLE_SHEET_WEB_APP_URL}?sheet=Guest%20Request`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Google Apps Script returned HTTP ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Guest Request proxy error:', error);
    return res.status(502).json({ error: 'Unable to load Guest Request data.' });
  }
}
