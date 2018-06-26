# docker-swarm-secrets

[![npm version](https://img.shields.io/npm/v/docker-swarm-secrets.svg)](https://www.npmjs.com/package/docker-swarm-secrets) [![Build Status](https://img.shields.io/travis/carriejv/docker-swarm-secrets.svg)](https://travis-ci.org/carriejv/docker-swarm-secrets) [![dependencies](https://img.shields.io/david/carriejv/docker-swarm-secrets.svg)](https://david-dm.org/carriejv/docker-swarm-secrets)  [![devDependencies](https://img.shields.io/david/dev/carriejv/docker-swarm-secrets.svg)](https://david-dm.org/carriejv/docker-swarm-secrets#info=devDependencies)


A simple library for synchronously and asynchronously retrieving [Docker secrets](https://docs.docker.com/engine/swarm/secrets/), with support for JSON parsing and varied encoding methods.

Asynchronous functions support [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and callbacks.

Secrets are only available in Docker Swarm `3.0+`.

Tested with Node `8.9.4+`.

## Installation

`npm install docker-swarm-secrets`

or

`yarn add docker-swarm-secrets`

## Usage

All cases use two example secrets, `text`, which contains some UTF-8 text, and `json`, which contains valid JSON.

For more information about creating and using secrets, please refer to the [Docker documentation](https://docs.docker.com/compose/compose-file/#secrets).

### Async, with Promises

```javascript
let dockerSecrets = require('docker-swarm-secrets');
// These are the default options, if none are passed.
let options = {
    encoding: 'utf-8',
    parseJSON: true,
    secretsDir: '/run/secrets'
};

dockerSecrets.readSecrets(options)
.then( (result) => {
    console.log(result.text); // 'Your text.'
    console.log(JSON.stringify(result.json)); // '{"this": "is", "valid": "json"}'
}).catch( (error) => {
    // Error handling.
});

// Or, read a single secret.

dockerSecret.readSecret('text', options)
.then( (result) => {
    console.log(result); // 'Your text.'
}).catch( (error) => {
    // Error handling.
});
```

### Async, with Callbacks

```javascript
let dockerSecrets = require('docker-swarm-secrets');
// These are the default options, if none are passed.
let options = {
    encoding: 'utf-8',
    parseJSON: true,
    secretsDir: '/run/secrets'
};

dockerSecrets.readSecrets(options, (err, result) => {
    if(err) {
        // Error handling.
    }
    else {
        console.log(result.text); // 'Your text.'
        console.log(JSON.stringify(result.json)); // '{"this": "is", "valid": "json"}'
    }
});

// Or, read a single secret.

dockerSecrets.readSecret('text', options, (err, result) => {
    if(err) {
        // Error handling.
    }
    else {
        console.log(result); // 'Your text.'
    }
});
```

### Synchronous

```javascript
let dockerSecrets = require('docker-swarm-secrets');
// These are the default options, if none are passed.
let options = {
    encoding: 'utf-8',
    parseJSON: true,
    secretsDir: '/run/secrets'
};

let result = dockerSecrets.readSecretsSync(options);
console.log(result.text); // 'Your text.'
console.log(JSON.stringify(result.json)); // '{"this": "is", "valid": "json"}'

// Or, read a single secret.

let result = dockerSecrets.readSecretSync('text', options);
console.log(result); // 'Your text.'
```


## Options
```javascript
var options = {
    encoding: 'utf-8',              // Accepts any encoding method supported by Node fs.
    parseJSON: true,                // If set to false, all secrets (including JSON) will be read as plain text.
    secretsDir: '/run/secrets',     // If set, reads from this directory instead of the Docker default of /run/secrets
};
```

## License

[MIT](https://github.com/carriejv/docker-swarm-secrets/blob/master/LICENSE)