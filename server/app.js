const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require("path");
const cors = require('cors');


function buildConfig(argv) {

  const config = {
    'port': 4000,
    'https': {
      'key': argv.key,
      'cert': argv.cert,
      'pfx': argv.pfx,
      'passphrase': argv.pass,
    }
  };
  return config;
}

function loadCertificateFiles(config) {
  // load https certs file content
  if (config && config.https) {
    ['key', 'cert', 'pfx'].forEach(key => {
      if (config.https[key]) {
        let file = config.https[key];
        config.https[key] = fs.readFileSync(file);
      }
    });
  }
  return config;
};

function validateParams (argv) {
  let isValid = true;
  const serviceFor=argv.s;

  if((argv.p==='' || !argv.p) && isValid) {
    isValid = false;
    process.stderr.write(`[${serviceFor}] port configuration is missing\n`);
  }

  if( (argv.k==='' && argv.c==='' && argv.x==='' && argv.w==='') && isValid) {
    isValid = false;
    process.stderr.write(`[${serviceFor}] https configuration is missing\n`);
  }

  if( ( (argv.k==='' && argv.c>'') || (argv.k>'' && argv.c==='')
      || (argv.x==='' && argv.w>'' && argv.k==='' && argv.c==='')
      || (argv.x==='' && argv.w>'' && !(argv.k>'' && argv.c>'')) 
      || (argv.x>'' && argv.w==='') ) && isValid) {
    isValid = false;
    process.stderr.write(`[${serviceFor}] https configuration is missing\n`);
  }

  if(!isValid) {
    process.stderr.write(`[${serviceFor}] is failed to start, error:\n`);
    process.exit(1);
    return false;
  }

  return true;
}

var argv = require('yargs')
  .usage('Usage: $0 [options]')
  .option('s', {
    alias: 'service',
    description: 'service-for path',
    default: ''
  })
  .option('p', {
    alias: 'port',
    description: 'listening port'
  })
  .option('k', {
    alias: 'key',
    default: '',
    description: 'server key'
  })
  .option('c', {
    alias: 'cert',
    default: '',
    description: 'server cert',
  })
  .option('x', {
    alias: 'pfx',
    default: '',
    description: 'server pfx',
  })
  .option('w', {
    alias: 'pass',
    default: '',
    description: 'server pfx passphrase',
  })
  .option('v', {
    alias: 'verbose',
    default: false,
    description: 'show request logs',
    type: 'boolean'
  })
  .help('h')
  .alias('h', 'help')
  .check(validateParams)
  .argv;

let config = buildConfig(argv);
config = loadCertificateFiles(config);
const {https:{key, cert}} = config;
const credentials = { key, cert };

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
 
var options = {
  explorer: false
};
 
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
app.use('/api-docs-ui', function(req, res, next){
  swaggerDocument.host = req.get('host');
  req.swaggerDoc = swaggerDocument;
  next();
}, swaggerUi.serve, swaggerUi.setup());


//TODO: use for whitelist only
app.use(cors());
const routes = require('./routes/index.route');

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/health', (req, res) => {
  const healthcheck = {
		uptime: process.uptime(),
		message: 'OK',
		timestamp: Date.now()
  };
  res.send(JSON.stringify(healthcheck));
});
app.use(routes);

app.use('/api-docs',function(req, res, next){
  swaggerDocument.host = req.get('host');
  res.send(swaggerDocument);
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(config.port);
httpsServer.listen(config.port+1);
console.log(`http server listening at port ${config.port}`);
console.log(`https server listening at port ${config.port + 1}`);

module.exports = { app };