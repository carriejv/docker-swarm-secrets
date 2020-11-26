# docker-swarm-secrets

[![npm version](https://img.shields.io/npm/v/docker-swarm-secrets.svg)](https://www.npmjs.com/package/docker-swarm-secrets) [![npm downloads](https://img.shields.io/npm/dt/docker-swarm-secrets)](https://www.npmjs.com/package/docker-swarm-secrets) [![dependencies](https://img.shields.io/david/carriejv/docker-swarm-secrets.svg)](https://david-dm.org/carriejv/docker-swarm-secrets) [![devDependencies](https://img.shields.io/david/dev/carriejv/docker-swarm-secrets.svg)](https://david-dm.org/carriejv/docker-swarm-secrets#info=devDependencies)


[![npm license](https://img.shields.io/npm/l/docker-swarm-secrets.svg)](https://www.npmjs.com/package/docker-sewarm-secrets) [![Build Status](https://img.shields.io/travis/carriejv/docker-swarm-secrets.svg)](https://travis-ci.org/carriejv/docker-swarm-secrets) [![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/carriejv) [![GitKraken](https://img.shields.io/badge/<3-GitKraken-green.svg)](https://www.gitkraken.com/invite/om4Du5zG)

Docker Swarm Secrets is a Node library for managing [Docker secrets](https://docs.docker.com/engine/swarm/secrets/). It aims to be a more robust and modern option than previous secret managers and includes:

* Async/Await Support
* Non-blocking File I/O
* Extensible Automatic Secret Parsing
* Typescript Compatability

For more information about creating and using secrets, please refer to the [Docker documentation](https://docs.docker.com/compose/compose-file/#secrets).

## Docker-Swarm-Secrets is Deprecated!

Docker-Swarm-Secrets has been rolled into [Technician](https://www.npmjs.com/package/technician), a brand new library that lets you manage all your application's config (secrets included!) using the familiar syntax of `docker-swarm-secrets`. This package will continue receiving security updates, but will no longer receive feature updates.

[![Technician](https://img.shields.io/npm/v/technician?label=technician)](https://www.npmjs.com/package/technician)

---

## Migration Guide

Migrating from `docker-swarm-secrets` to `technician` is easy. The biggest difference is that `technician` returns only the secret value from `read()`. The object containing the raw data Buffer is still available via `describe()`.

Technician also caches results forever by default, instead of not caching by default (a decision that was made for legacy compatability in dss).

### In Docker-Swarm-Secrets:
```ts
import { DSSReader } from 'docker-swarm-secrets';
// ...
const secretReader = new DSSReader();
const mySecret = await secretReader.readSecret('mySecret');
// mySecret === { name: 'mySecret', data: Buffer, secret: Buffer | ParsedData }
```

### In Technician:
```ts
import { Technician } from 'technician';
import { FSConfigSource } from '@technician/fs-config-source';
// ...
const technicianReader = new Technician();
// Alternatively, your own secret mount point.
// Technician is built to work with any files, not just secrets!
technicianReader.addSource(new FSConfigSource('/run/secrets'));
const mySecret = await technicianReader.read('mySecret');
// mySecret === Buffer<your file contents here>
```

## Migrating Interpreters

Custom interpreters are now even more flexible in `technician`! Interpreters are set at the reader level in Technician, instead of being passed in with each read. This allows for less complex typing when accessing the cache. To return multiple data types, you can still create a complex branching interpreter -- or just use multiple Technician instances.

Consult the Technician docs for more information on all the new features added to interpreters.

The same `DefaultInterpreters` package is still available from Technician as well.

### A Docker-Swarm-Secrets Interpreter:
```ts
// ...
const mySecret = await secretReader.readSecret('mySecret', 
    secret => secret?.data.toString('utf8')
);
// mySecret === { name: 'mySecret', data: Buffer, secret: string }
```

### A Technician Interpreter:
```ts
// ...
const technicianReader = new Technician(
    secret => value: secret?.data.toString('utf8')
);
const mySecret = await technicianReader.readSecret('mySecret');
// typeof mySecret === 'string'
```

---

## Installation

`npm i docker-swarm-secrets`

Version `2.x.x` is compatible with Node 10 LTS and up. For compatability with prior Node releases, use the latest `1.x.x` release.

## Usage

### Basic Example
```ts
import { DSSReader } from 'docker-swarm-secrets';

// ...

const secretReader = new DSSReader();
const mySecret = await secretReader.readSecret('mySecret');
/**
 * { name: 'mySecret', data: Buffer, secret: Buffer | ParsedData }
 */

// or ...

const allMySecrets = await secretReader.readSecrets();
db.connect(allMySecrets.dbUsername.secret, allMySecrets.dbPassword.secret);
```

### Secret Parsing & Typing

By default, all valid secrets are returned as Buffers. Secrets that do not exist are returned as undefined.

If you wish to provide parsing logic for secrets, you may provide an `interpreter` function. The `secret` value of the returned object will be set to the value returned by your `interpreter` function. Typescript should infer your typing automatically.

```ts
const myStringSecret = await secretReader.readSecret('myStringSecret', 
    secret => secret.?data.toString('utf8')
);
myStringSecret.substring(0, 1); // Typescript is okay with this!

// or, you can manually specify the typing ...

const myBoolSecret = await secretReader.readSecret<boolean>('myBoolSecret', 
    secret => secret.name === 'myBoolSecret'
);
```

Interpreters can handle any logic necessary to get a secret into a usable state (deserialization, decryption, etc.) whenever it needs to be accessed to reduce duplication of complex parsing code.

```ts
const mySuperComplicatedInterpreter = (secret) => {
    // ... 10,000 lines later
};
// Reuse it to parse all your secrets
const mySuperSecretStuff = await secretReader.readSecrets(mySuperComplicatedInterpreter);
```

### Multiple Interpreters

If you need to handle a variety of secret data types, you may specify multiple interpreters with `readSecrets`.

These interpreters may have an optional `predicate`, which determines which secrets are passed to them. The first matching interpreter wins. If no interpreters match a secret, it will not be returned. A catch-all interpreter with no predicate may also be specified.

```ts
const allMyParsedSecrets = secretReader.readSecrets([
    { // Will only run on secrets ending in .json
        interpreter: s => JSON.parse(s?.data.toString('utf8')),
        predicate: s => /\.json$/.test(s.name)
    }, 
    { // Will match any secret
        interpreter: s => s.?data.toString('utf8')
    },
]);
```

### Default Interpreters

DSS provides a package of ready-to-use interpeters as `DefaultInterpreters`.

```ts
import { DSSReader, DefaultInterpreters } from 'docker-swarm-secrets';

// ...

// (Default behavior if no interpreter is specified).
const myBufferSecret = secretReader.readSecret('secret', DefaultInterpreters.asBuffer());

// Default encoding is UTF8.
const myStringSecret = secretReader.readSecret('secret', DefaultInterpreters.asText('utf8'));

// Default encoding is UTF8. Invalid JSON will not be returned.
const myJSONSecret = secretReader.readSecret('secret', DefaultInterpreters.asJSON('utf8'));

// Returns JSON if the text is valid JSON or plaintext if it is not.
// This emulates the behavior of dss 1.x.x and is provided for easy migration.
// It is substantially less efficient than using specific interpreters with predicates.
const legacyStyleSecret = secretReader.readSecret('secret', DefaultInterpreters.asTextOrJSON('utf8'));
```

## Synchronous Options

`readSecretSync` and `readSecretsSync` are also available for synchronous code.

They are otherwise identical to the async versions.

## Specifying a Mount Point

If you mount your Docker secrets at a non-default path, you may specify it as an argument to the `DSSReader` constructor.

Each reader instance may only read from one secret filesystem.

```ts
const secretReader = new DSSReader('/some/place/full/of/secrets');
```

## Migrating from `1.x.x`

Docker Swarm Secrets `2.x.x` provides much more flexibility with secret reading and parsing than prior versions.

If you wish to emulate the behavior of version `1.x.x`, the following code approximates it.

```ts
// 1.x.x - Automatic JSON parsing
const mySecret = dss.readSecret('secret', { encoding: 'utf8', ignoreJSON: false }, (err, secret) => {
    // ...
});
// 2.x.x
const mySecret = await secretReader.readSecret('secret', DefaultInterpreters.asTextOrJSON('utf8'));

// 1.x.x - Plaintext only
const mySecret = dss.readSecret('secret', { encoding: 'utf8', ignoreJSON: true }, (err, secret) => {
    // ...
});
// 2.x.x
const mySecret = await secretReader.readSecret('secret', DefaultInterpreters.asText('utf8'));

```

## Contributions

Contributions and pull requests are always welcome. Please be sure your code passes all existing tests and linting.

Pull requests with full code coverage are encouraged.

## License

[MIT](https://github.com/carriejv/docker-swarm-secrets/blob/master/LICENSE)