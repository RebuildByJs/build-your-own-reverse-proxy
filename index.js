const http = require('http');
const { parse: urlParse } = require('url');

module.exports = function reverseProxy (opts) {
  if (!Array.isArray(opts.servers)) throw new Error('opts.servers must be a array.');
  if (!opts.servers || opts.servers.length === 0) throw new Error('server cannot empty');

  const servers = opts.servers.map((s) => {
    const [host, port = 80] = s.split(':');
    return {
      host, port
    }
  });
  
  let getTarget = (function () {
    let index = 0;
    let length = servers.length;
    return () => {
      if (index >= length) index = 0;
      let tar = servers[index];
      index ++;
      return tar;
    };
  })();

  let bindError = (req, res, id) => {
    return (err) => {
      let msg = String(err.stack || err);
      console.log(msg, new Date());
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(msg);
    }
  };


  return function proxy (req, res) {
    const trueServer = getTarget();
    let { path } = urlParse(req.url);

    let requestInfo = {
      ...trueServer,
      method: req.method,
      path,
      header: req.headers
    };
    
    const requestId = `${req.method} ${req.url} => ${trueServer.host}:${trueServer.port}`;
    let onError = bindError(req, res, requestId);
    console.log(requestId, new Date());

    const req2 = http.request(requestInfo, (res2) => {
      res2.on('error', onError);
      console.log(`${requestId} response ${req2.statusCode}`, new Date());
      res.writeHead(res2.statusCode, res2.headers);
      res2.pipe(res);
    });

    req.pipe(req2);
    req2.on('error', onError);
  } 
};