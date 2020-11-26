import * as fs from 'fs';
import * as path from 'path';

import { DefaultInterpreters } from '../interpreters/default-interpreters';
import { DefaultInterpretersSync } from '../interpreters/default-interpreters-sync';
import { Secret, RawSecret, Interpreter, InterpreterSync, PredicatedInterpreter, PredicatedInterpreterSync } from '../internal/internal-types';

/** The default mount point of a docker secrets file system. */
const DEFAULT_DOCKER_SECRETS_MOUNT = '/run/secrets';

/** Default cache length. 0 = permanent. -1 = disabled. */
const DEFAULT_CACHE_LENGTH = 0;

/** Defines a secret reader object, which reads secrets from a configured secret mount point. */
export class SecretReader {

    private secretsCache: {[key: string]: Secret<any>} = {};

    /** Builds a new DSSReader for a Docker secrets filesystem at a given mount point. */
    public constructor(private secretsDirectory: string = DEFAULT_DOCKER_SECRETS_MOUNT,
                       private defaultCacheLength: number = DEFAULT_CACHE_LENGTH) {}

    /**
     * Reads a single secret by name asynchronously, optionally parsing it into type T using an `interpreter` function.
     * @param name          The name of the secret to read
     * @param interpreter   The interpreter function to run on the secret.
     *                      This function will be called on a secret after it is read, setting the calculated value of the secret to its return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data as type T.
     *                      If omitted, T is assumed to be Buffer and the secret data is returned as a raw Buffer.
     */
    public async read<T = Buffer>(name: string, interpreter?: Interpreter<T>): Promise<Secret<T>> {
        // Read in the target secret file
        const data = await this.readSecretFile(name);

        // Run the interpreter -- Typecast is needed to satisfy compiler in the default case
        const interpreterResult = (interpreter ?? DefaultInterpreters.asBuffer({cacheFor: this.defaultCacheLength, exportToEnv: this.defaultExportToEnv}))({name, data});

        // Check what the interpreter response is.
        let secret = interpreterResult as T;
        if(this.isDSSInterpretation<T>(interpreterResult)) {
            secret = interpreterResult.secret;
            // Cache the secret.
            if(interpreterResult.cacheFor !== undefined && interpreterResult.cacheFor >= 0)
            this.secretsCache[name] = {
                name,
                data,
                secret,
                expiresAt: interpreterResult.cacheFor ? Date.now() + interpreterResult.cacheFor : 0
            }

        }

        // Return the result
        return { name, data, secret };
    }

    /**
     * Reads all available secrets asynchronously, optionally parsing them using `interpreter` and `predicate` functions.
     * Secrets are returned as an object keyed by secret name.
     * @param interpreters  The interpreter functions to run on secrets.
     *                      If a given `predicate` returns true for a secret, the associated `interpreter` will be called.
     *                      First matching interpreter wins. Secrets that do not match any interpreter will be ignored.
     *                      If no predicate is provided, the interpreter will match all secrets. This will prevent any subsequent interpreters from being checked.
     *                      Interpreter functions set the calculated value of the secret to their return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data.
     *                      If no interpreters are provided, all available secrets will be returned as raw Buffers.
     */
    public async readSecrets<T = Buffer>(interpreters?: DSSPredicatedInterpreter<T> | DSSPredicatedInterpreter<T>[]): Promise<{[key: string]: DSSSecret<T>}> {
        // Create result array
        const result: {[key: string]: DSSSecret<T>} = {};

        // Handle varied interpreter args
        interpreters = interpreters ?? [{interpreter: DefaultInterpreters.asBuffer() as any}];
        if(!Array.isArray(interpreters)) {
            interpreters = [interpreters];
        }

        // Read each file in the target directory
        const dir = await fs.promises.readdir(this.secretsDirectory);
        for(const name of dir) {
            const data = await this.readSecretFile(name);

            // Append the default unpredicated interpreter, then check for valid interpreters
            let secret: T | undefined = undefined;
            for(const candidate of interpreters) {
                // Secrets matching a predicate (or a default interpreter) are parsed and returned.
                if(!candidate.predicate || candidate.predicate({name, data})) {
                    secret = candidate.interpreter({name, data}) as T;
                    result[name] = ({name, data, secret});
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
     */
    public readSecretSync<T = Buffer>(name: string, interpreter?: InterpreterSync<T>): T {
        // Read in the target secret file
        const data = this.readSecretFileSync(name);

        // Run the interpreter -- Typecast is needed to satisfy compiler in the default case
        return (interpreter ?? DefaultInterpretersSync.asBuffer())({name, data}) as T;
    }

    /**
     * Reads all available secrets synchronously, optionally parsing them using `interpreter` and `predicate` functions.
     * Secrets are returned as an object keyed by secret name.
     * @param interpreters  The interpreter functions to run on secrets.
     *                      If a given `predicate` returns true for a secret, the associated `interpreter` will be called.
     *                      First matching interpreter wins. Secrets that do not match any interpreter will be ignored.
     *                      If no predicate is provided, the interpreter will match all secrets. This will prevent any subsequent interpreters from being checked.
     *                      Interpreter functions set the calculated value of the secret to their return value.
     *                      This may be used to check data for validity, deserialize data, and/or any other work necessary to parse the raw secret data.
     *                      If no interpreters are provided, all available secrets will be returned as raw Buffers.
     */
    public readSecretsSync<T = Buffer>(interpreters?: InterpreterSync<T> | PredicatedInterpreterSync<T>[]): {[key: string]: T} {
        // Create result array
        const result: {[key: string]: T} = {};

        // Handle varied interpreter args
        if(!Array.isArray(interpreters)) {
            interpreters = [{interpreter: interpreters ?? DefaultInterpretersSync.asBuffer()}];
        }

        // Read each file in the target directory
        const dir = fs.readdirSync(this.secretsDirectory);
        for(const name of dir) {
            const data = this.readSecretFileSync(name);
            for(const candidate of interpreters) {
                // Secrets matching a predicate (or a default interpreter) are parsed and returned.
                if(!candidate.predicate || candidate.predicate({name, data})) {
                    result[name] = candidate.interpreter({name, data}) as T;
                    break;
                }
            }
        }

        // Return the result
        return result;
    }

    /**
     * Reads a file in the secrets directory by name.
     * Returns undefined if missing.
     * @param name The file name to read
     * @param require If true, throws an error instead of returning undefined on a missing secret.
     */
    private async readSecretFile(name: string, require?: boolean): Promise<Buffer | undefined> {
        // Read in the target secret file
        try {
            return await fs.promises.readFile(path.join(this.secretsDirectory, name));
        }
        catch(err) {
            // Missing secrets are not an error condition, just an undefined data buffer for the interpreter.
            if(err.code === 'ENOENT') {
                return undefined;
            }
            throw err;
        }
    }

    /**
     * Reads a file in the secrets directory by name synchronously.
     * Returns undefined if missing.
     * @param name The file name to read
     * @param require If true, throws an error instead of returning undefined on a missing secret.
     */
    private readSecretFileSync(name: string, require?: boolean): Buffer | undefined {
        // Read in the target secret file
        try {
            return fs.readFileSync(path.join(this.secretsDirectory, name));
        }
        catch(err) {
            // Missing secrets are not an error condition, just an undefined data buffer for the interpreter.
            if(err.code === 'ENOENT') {
                return undefined;
            }
            throw err;
        }
    }

    /**
     * Checks if the return of an interpreter function is a raw value or a secret object with config.
     * @param secret The interpreter return value.
     */
    private isSecretObject<T>(secret: Secret<T> | T): secret is Secret<T> {
        return typeof secret === 'object' && Object.keys(secret).includes('secret');
    }
}
