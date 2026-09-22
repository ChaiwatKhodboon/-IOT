const clients = new Set();

function events(_req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();
  res.write('retry: 2000\n');
  res.write(`data: ${JSON.stringify({ type: 'connected', at: Date.now() })}\n\n`);
  clients.add(res);

  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
  _req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

function broadcast(type) {
  const message = `data: ${JSON.stringify({ type, at: Date.now() })}\n\n`;
  for (const client of clients) client.write(message);
}

module.exports = { events, broadcast };
