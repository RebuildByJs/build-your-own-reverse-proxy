const http = require('http');
const proxy = require('../index');

const setupProxy = (port) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer(proxy({
      servers: ['localhost:3001', 'localhost:3002', 'localhost:3003']
    }));
    server.listen(port, () => {
      console.log(`proxy listening on ${port}`);
      resolve();
    });
    server.on('error', reject);
  });
};


const setupServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let chunks = [];
      
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        let data = Buffer.concat(chunks);
      });
      
      res.end('fuck');
    })
    
    server.listen(port, () => {
      console.log(`listening on port ${port}`);
      resolve();
    });

    server.on('error', reject);
  });
};


(async function () {
  await setupServer(3001);
  await setupServer(3002);
  await setupServer(3003);
  await setupProxy(3000);
})();