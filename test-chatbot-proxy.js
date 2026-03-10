const fetch = require('node-fetch');
async function run() {
  const response = await fetch('https://concordia.nadro.dev/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'ocr_7595b10ac28b072fd7e2c0ee0cd994c9'
      },
      body: JSON.stringify({
        message: "hola",
        systemInstruction: "test",
        context: "test",
        history: [],
        file: null
      })
    });
  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Body:', text);
}
run();
