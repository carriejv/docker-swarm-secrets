# container-secrets

[![npm version](https://img.shields.io/npm/v/container-secrets.svg)](https://www.npmjs.com/package/container-secrets) [![npm downloads](https://img.shields.io/npm/dt/container-secrets)](https://www.npmjs.com/package/container-secrets) [![npm license](https://img.shields.io/npm/l/container-secrets.svg)](https://www.npmjs.com/package/docker-sewarm-secrets)


[![dependencies](https://img.shields.io/david/carriejv/container-secrets.svg)](https://david-dm.org/carriejv/container-secrets) [![Build Status](https://img.shields.io/travis/carriejv/container-secrets.svg)](https://travis-ci.org/carriejv/container-secrets) [![GitKraken](https://img.shields.io/badge/<3-GitKraken-green.svg)](https://www.gitkraken.com/invite/om4Du5zG)

Container Secrets is a Node library for accessing, parsing, and caching [Docker](https://docs.docker.com/engine/swarm/secrets/) and [Kubernetes](https://kubernetes.io/docs/concepts/configuration/secret/) secrets in containerized Node applications. It aims to be a robust solution for environments with complex and numerous secrets. It includes:

* Asynchronous secret reading and parsing
* Extensible parsing and caching system
* Secret override via environment variable
* Typescript type inferrence for secrets, with custom types supported.

## Installation

`npm i container-secrets`

`container-secrets` is compatible with Node 10 LTS and up. For compatability with prior Node releases, please use the latest 1.x.x release of [docker-swarm-secrets](https://www.npmjs.com/package/docker-swarm-secrets/v/1.0.0).

## Usage

### Basic Example
```ts
import { DockerSecretReader, KubernetesSecretReader } from 'container-secrets';

// ...

const secretReader = new DockerSecretReader();
const mySecret = await secretReader.readSecret('mySecret');

// or ...

const allMySecrets = await secretReader.readSecrets();
db.connect(allMySecrets.dbUsername, allMySecrets.dbPassword);
```

`DockerSecretsReader` and `KubernetesSecretReader` have identical APIs and functionality.

### Secret Parsing & Typing

By default, all valid secrets are returned as Buffers. Secrets that do not exist are returned as undefined.

If you wish to provide parsing logic for secrets, you may provide an `interpreter` function. The return of this function will be cached, and will be returned instead of the raw secret buffer any time it is accessed. Typescript should infer your typing automatically.

The argument passed to the interpreter has `name` and `data` properties.

```ts
const myStringSecret = await secretReader.readSecret('myStringSecret', 
    secret => secret?.data.toString('utf8')
);
myStringSecret.substring(0, 1); // Typescript is okay with this!

// or, you can manually specify the typing ...

const myBoolSecret = await secretReader.readSecret<boolean>('myBoolSecret', 
    secret => secret.name === 'myBoolSecret'
);
```

Interpreters can handle any logic necessary to get a secret into a usable state (deserialization, decryption, etc.). The function will be run any time the cached result expires, reducing duplication of complex parsing code.

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
        interpreter: s => s?.data.toString('utf8')
    },
]);
```

### Default Interpreters

`container-secrets` provides a package of ready-to-use interpeters as `DefaultInterpreters`.

```ts
import { DefaultInterpreters } from 'container-secrets';

// ...

// (Default behavior if no interpreter is specified).
const myBufferSecret = secretReader.readSecret('secret', DefaultInterpreters.asBuffer());

// Default encoding is UTF8.
const myStringSecret = secretReader.readSecret('secret', DefaultInterpreters.asText('utf8'));

// Default encoding is UTF8. Invalid JSON will not be returned.
const myJSONSecret = secretReader.readSecret('secret', DefaultInterpreters.asJSON('utf8'));

// Returns JSON if the text is valid JSON or plaintext if it is not.
// This emulates the behavior of docker-swarm-secrets 1.x.x.
// It is substantially less efficient than using specific interpreters with predicates.
const legacyStyleSecret = secretReader.readSecret('secret', DefaultInterpreters.asTextOrJSON('utf8'));
```

## Synchronous Options

`readSecretSync` and `readSecretsSync` are also available for synchronous code.

They are otherwise identical to the async versions.

Note that a synchronous read cannot run an asynchronous interpreter. A `DefaultInterpretersSync` package is provided, which provides the same functionality as `DefaultInterpreters`.

## Specifying a Mount Point

If you mount your secrets at a non-default path, you may specify it as an argument to the `DockerSecretReader` or `KubernetesSecretReader` constructor.

Each reader instance may only read from one secret filesystem.

```ts
const secretReader = new DockerSecretReader('/some/place/full/of/secrets');
```

## Migrating from `docker-swarm-secrets`

`container-secrets` provides much more flexibility with secret reading and parsing than its predecessor, `docker-swarm-secrets`.

If you wish to emulate the behavior of version `docker-swarm-secrets` `1.x.x`, the following code approximates it.

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

[MIT](https://github.com/carriejv/container-secrets/blob/master/LICENSE)