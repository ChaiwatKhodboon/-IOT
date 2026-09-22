const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { events, broadcast } = require('../src/realtime');

test('SSE clients receive realtime change events', () => {
  const request = new EventEmitter();
  const chunks = [];
  const response = {
    set() {},
    flushHeaders() {},
    write(chunk) { chunks.push(chunk); }
  };

  events(request, response);
  broadcast('loans');
  request.emit('close');

  assert.match(chunks.join(''), /"type":"connected"/);
  assert.match(chunks.join(''), /"type":"loans"/);
});
