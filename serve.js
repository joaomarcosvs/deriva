// Servidor opcional para desenvolvimento. O index.html também abre diretamente.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = { '/': 'index.html', '/index.html': 'index.html', '/src/grammar.js': 'src/grammar.js', '/src/app.js': 'src/app.js', '/src/style.css': 'src/style.css' };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
function createServer() {
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url, 'http://localhost').pathname;
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Endereço inválido');
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(files, pathname)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado');
      return;
    }
    const name = files[pathname];
    fs.readFile(path.join(__dirname, name), (error, content) => {
      res.writeHead(error ? 500 : 200, { 'Content-Type': `${types[path.extname(name)]}; charset=utf-8` });
      res.end(error ? 'Erro ao ler arquivo' : content);
    });
  });
}
if (require.main === module) {
  createServer().listen(4173, '127.0.0.1', () => console.log('Programa disponível em http://127.0.0.1:4173'));
}
module.exports = { createServer };
