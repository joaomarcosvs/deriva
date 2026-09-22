// Servidor opcional para desenvolvimento. O index.html também abre diretamente.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = { '/': 'index.html', '/index.html': 'index.html', '/src/grammar.js': 'src/grammar.js', '/src/app.js': 'src/app.js', '/src/style.css': 'src/style.css' };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
http.createServer((req, res) => {
  const name = files[new URL(req.url, 'http://localhost').pathname];
  if (!Object.prototype.hasOwnProperty.call(files, new URL(req.url, 'http://localhost').pathname)) { res.writeHead(404); res.end('Não encontrado'); return; }
  fs.readFile(path.join(__dirname, name), (error, content) => {
    res.writeHead(error ? 500 : 200, { 'Content-Type': `${types[path.extname(name)]}; charset=utf-8` });
    res.end(error ? 'Erro ao ler arquivo' : content);
  });
}).listen(4173, '127.0.0.1', () => console.log('Programa disponível em http://127.0.0.1:4173'));
