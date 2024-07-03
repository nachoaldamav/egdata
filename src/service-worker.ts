// Listen for messages from clients
self.addEventListener('message', async (event) => {
  console.log('Message received from client', event.data);
  const { type, payload } = event.data;

  if (type === 'track') {
    console.log('Tracking event', payload);
    // Send request to 'http://localhost:4000/ping' with the payload (PUT method)
    await fetch('http://localhost:4000/ping', {
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
