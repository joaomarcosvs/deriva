const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../serve.js');

async function start(t) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return server;
}
function request(server, path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port: server.address().port, path, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
  });
}

test('servidor entrega a página e os três recursos locais com seus tipos corretos', async t => {
  const server = await start(t);
  for (const [path, type] of [['/', 'text/html'], ['/index.html', 'text/html'], ['/src/grammar.js', 'text/javascript'], ['/src/app.js', 'text/javascript'], ['/src/style.css', 'text/css']]) {
    const response = await request(server, path);
    assert.equal(response.status, 200, path);
    assert.equal(response.type, `${type}; charset=utf-8`, path);
    assert.ok(response.body.length > 0, path);
  }
});

test('servidor recusa arquivos fora da lista pública', async t => {
  const server = await start(t);
  for (const path of ['/package.json', '/../package.json', '/README.md', '/__proto__']) {
    assert.equal((await request(server, path)).status, 404, path);
  }
});

test('endereço inválido responde 400 e mantém o servidor disponível', async t => {
  const server = await start(t);
  const invalid = await request(server, '//[');
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body, 'Endereço inválido');
  assert.equal((await request(server, '/')).status, 200);
});
