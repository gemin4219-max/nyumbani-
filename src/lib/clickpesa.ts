const CLIENT_ID = process.env.EXPO_PUBLIC_CLICKPESA_CLIENT_ID;
const API_KEY = process.env.EXPO_PUBLIC_CLICKPESA_API_KEY;

// Base API URL (Update this if your merchant dashboard specifies a different sandbox/production URL)
const BASE_URL = 'https://api.clickpesa.com/v1';

/**
 * Exchanges the Client ID and API Key for a JWT Authorization token.
 */
export async function getAuthToken() {
  if (!CLIENT_ID || !API_KEY) {
    throw new Error('ClickPesa credentials are not configured in .env');
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        api_key: API_KEY,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('ClickPesa Auth Failed Response:', text);
      throw new Error(`Auth failed: ${text}`);
    }

    const data = await response.json();
    return data.access_token || data.token;
  } catch (error) {
    console.error('ClickPesa Auth Error:', error);
    throw error;
  }
}

/**
 * Triggers a USSD push request to the user's phone for payment collection.
 */
export async function requestUssdPush(amount: number, phoneNumber: string, orderReference: string) {
  try {
    const token = await getAuthToken();

    const payload = {
      amount: amount.toString(),
      currency: "TZS",
      orderReference,
      phoneNumber,
      fetchSenderDetails: false
    };

    const response = await fetch(`${BASE_URL}/third-parties/payments/preview-ussd-push-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('ClickPesa Payment Failed Response:', text);
      throw new Error(`ClickPesa API Error: ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ClickPesa Payment Error:', error);
    throw error;
  }
}
