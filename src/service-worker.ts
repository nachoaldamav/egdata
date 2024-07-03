// Listen for messages from clients
self.addEventListener('message', async (event) => {
  console.log('Message received from client', event.data);
  const { type, payload } = event.data;

  if (type === 'track') {
    console.log('Tracking event', payload);
    await fetch('https://api.egdata.app/ping', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
    }).catch((err) => {
      console.error('Error sending request to server', err);
    });

    console.log('Event tracked');
  }
});
