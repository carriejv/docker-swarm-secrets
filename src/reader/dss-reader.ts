import * as fs from 'fs';
import * as path from 'path';

import { DefaultInterpreters } from '../interpreters/interpreters';

/** The default mount point of a docker secrets file system. */
const DEFAULT_DOCKER_SECRETS_MOUNT = '/run/secrets';

/** Defines an interpreter function. */
export type DSSInterpreter<T> = (rawSecret: DSSRawSecret) => T;

/** Defines an interpreter predicate function. */
export type DSSPredicate = (rawSecret: DSSRawSecret) => boolean;

/** Defines an interpreter which is only run if a given condition is satisfied. */
export interface DSSPredicatedInterpreter<T> {
    interpreter: DSSInterpreter<T>;
    prediacte?: DSSPredicate;
}

/** Defines info about a secret being read, pre-interpretation */
export interface DSSRawSecret {
    /** The name of the secret. */
    name: string;
    /** The data contents of the secret, if it exists. */
    data?: Buffer;
}

/** Defines a secret that has been interpreted as a specific data type. */
export interface DSSSecret<T> extends DSSRawSecret {
    /** The calculated value of the secret. */
    secret?: T;
}

/** Defines a Docker Swarm Secrets reader object, which reads secrets from a configured secrets mount point (/run/secrets by default). */
export class DSSReader {

    /** Builds a new DSSReader for a Docker secrets filesystem at a given mount point. */
    public constructor(private secretsDirectory: string = DEFAULT_DOCKER_SECRETS_MOUNT) {}

    /**
     * Reads a single secret by name asynchronously, optionally parsing it into type T using an `interpreter` function.
     * @param name          The name of the secret to read
     * @param interpreter   The interpreter function to run on the secret.
     *                      This function will be called on a secret after it is read, setting the calculated value of the secret to its return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data as type T.
     *                      If omitted, T is assumed to be Buffer and the secret data is returned as a raw Buffer.
     * @param callback      Optional callback for handling the asynchronous return value, if preferred to async/await.
     */
    public async readSecret<T = Buffer>(name: string, interpreter?: DSSInterpreter<T>): Promise<DSSSecret<T>> {
        // Read in the target secret file
        const data = await this.readFileIgnoreMissing(name);

        // Run the interpreter -- Typecast is needed to satisfy compiler in the default case
        const secret = (interpreter ?? DefaultInterpreters.asBuffer())({name, data}) as T;

        // Return the result
        return { name, data, secret };;
    }

    /**
     * Reads all available secrets asynchronously, optionally parsing them using `interpreter` and `predicate` functions.
     * Due to the possibility of returning secrets of a variety of arbitrary types, typing is disabled by default on `readSecrets`.
     * If desired, a parameterized type <T> may still be specified for interpreted secret values.
     * To utilize typing, use `readSecret` on individual secrets.
     * @param interpreters  The interpreter functions to run on secrets.
     *                      If a given `predicate` returns true for a secret, the associated `interpreter` will be called.
     *                      First matching interpreter wins. Secrets that do not match any interpreter will be ignored.
     *                      If no predicate is provided, the interpreter will match all secrets. This will prevent any subsequent interpreters from being checked.
     *                      Interpreter functions set the calculated value of the secret to their return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data.
     *                      If no interpreters are provided, all available secrets will be returned as raw Buffers.
     * @param callback      Optional callback for handling the asynchronous return value, if preferred to async/await.
     */
    public async readSecrets<T = Buffer>(interpreters?: DSSPredicatedInterpreter<T>[]): Promise<DSSSecret<T>[]> {
        // Create result array
        const result: DSSSecret<T>[] = [];

        // Read each file in the target directory
        const dir = await fs.promises.readdir(this.secretsDirectory);
        for(const name of dir) {
            const data = await this.readFileIgnoreMissing(name);

            // Append the default unpredicated interpreter, then check for valid interpreters
            let secret: T | undefined = undefined;
            for(const candidate of interpreters ?? [{interpreter: DefaultInterpreters.asBuffer(), prediacte: null}]) {
                // Secrets matching a predicate (or a default interpreter) are parsed and returned.
                if(!candidate.prediacte || candidate.prediacte({name, data})) {
                    secret = candidate.interpreter({name, data}) as T;
                    result.push({name, data, secret});
                    break;
                }
            }
        }

        // Return the result
        return result;
    }

    /**
     * Reads a single secret by name synchronously, optionally parsing it into type T using an `interpreter` function.
     * @param name          The name of the secret to read
     * @param interpreter   The interpreter function to run on the secret.
     *                      This function will be called on a secret after it is read, setting the calculated value of the secret to its return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data as type T.
     *                      If omitted, T is assumed to be Buffer and the secret data is returned as a raw Buffer.
     * @param callback      Optional callback for handling the asynchronous return value, if preferred to async/await.
     */
    public readSecretSync<T = Buffer>(name: string, interpreter?: DSSInterpreter<T>): DSSSecret<T> {
        // Read in the target secret file
        const data = this.readFileIgnoreMissingSync(name);

        // Run the interpreter -- Typecast is needed to satisfy compiler in the default case
        const secret = (interpreter ?? DefaultInterpreters.asBuffer)({name, data}) as T;

        // Return the result
        return { name, data, secret };
    }

    /**
     * Reads all available secrets synchronously, optionally parsing them using `interpreter` and `predicate` functions.
     * Due to the possibility of returning secrets of a variety of arbitrary types, typing is disabled by default on `readSecrets`.
     * If desired, a parameterized type <T> may still be specified for interpreted secret values.
     * To utilize typing, use `readSecret` on individual secrets.
     * @param interpreters  The interpreter functions to run on secrets.
     *                      If a given `predicate` returns true for a secret, the associated `interpreter` will be called.
     *                      First matching interpreter wins. Secrets that do not match any interpreter will be ignored.
     *                      If no predicate is provided, the interpreter will match all secrets. This will prevent any subsequent interpreters from being checked.
     *                      Interpreter functions set the calculated value of the secret to their return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data.
     *                      If no interpreters are provided, all available secrets will be returned as raw Buffers.
     * @param callback      Optional callback for handling the asynchronous return value, if preferred to async/await.
     */
    public async readSecretsSync<T = Buffer>(interpreters?: DSSPredicatedInterpreter<T>[]): Promise<DSSSecret<T>[]> {
        // Create result array
        const result: DSSSecret<T>[] = [];

        // Read each file in the target directory
        const dir = fs.readdirSync(this.secretsDirectory);
        for(const name of dir) {
            const data = this.readFileIgnoreMissingSync(name);

            // Append the default unpredicated interpreter, then check for valid interpreters
            let secret: T | undefined = undefined;
            for(const candidate of interpreters ?? [{interpreter: DefaultInterpreters.asBuffer(), prediacte: null}]) {
                // Secrets matching a predicate (or a default interpreter) are parsed and returned.
                if(!candidate.prediacte || candidate.prediacte({name, data})) {
                    secret = candidate.interpreter({name, data}) as T;
                    result.push({name, data, secret});
                    break;
                }
            }
        }

        // Return the result
        return result;
    }

    /**
     * Reads a file in the secrets directory by name, returning undefined if it is missing instead of throwing an error.
     * @param name The file name to read
     */
    private async readFileIgnoreMissing(name: string): Promise<Buffer | undefined> {
        // Read in the target secret file
        try {
            return fs.promises.readFile(path.join(this.secretsDirectory, name));
        }
        catch(err) {
            // Missing secrets are not an error condition, just an undefined data buffer for the interpreter.
            if(err.code !== 'ENOENT') {
                return undefined;
            }
            throw err;
        }
    }

    /**
     * Reads a file in the secrets directory by name synchronously, returning undefined if it is missing instead of throwing an error.
     * @param name The file name to read
     */
    private readFileIgnoreMissingSync(name: string): Buffer | undefined {
        // Read in the target secret file
        try {
            return fs.readFileSync(path.join(this.secretsDirectory, name));
        }
        catch(err) {
            // Missing secrets are not an error condition, just an undefined data buffer for the interpreter.
            if(err.code !== 'ENOENT') {
                return undefined;
            }
            throw err;
        }
    }
}