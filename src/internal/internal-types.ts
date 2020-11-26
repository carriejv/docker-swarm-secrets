/** Encoding types supported by the default `asText` interpreters. */
export type SupportedEncoding = 'utf8' | 'utf-8' | 'ucs2' | 'ucs-2' | 'utf16le' | 'ascii' | 'hex' | 'base64' | 'binary' | 'latin1';

/** JSON typing for return of the default asJSON interpreters. */
export type JSON = {[key: string]: string | number | boolean | Date | JSON | JSON[]};

/** Defines info about a secret being read, pre-interpretation */
export interface RawSecret {
    /** The name of the secret. */
    name: string;
    /** The data contents of the secret, if it exists. */
    data?: Buffer;
}

/** 
 * Defines a parsed secret and related config.
 * This object is returned by interpreter functions.
 */
export interface Secret<T> {
    /** The intepreted secret to store and return. */
    secret: T;
    /** Timestamp for cache expirey. If unset, caches forever. If negative, does not cache. */
    cacheFor?: number;
    /** Environment variable which can override the value of the secret. */
    envOverride?: string;
    /** 
     * Environment variable which can override the value of the secret.
     * Raw overrides are not run through the interpreter function, but will be set directly as the secret.
     */
    envOverrideRaw?: string;
}

/** Secret object stored in the internal cache. */
export interface CachedSecret<T> extends RawSecret, Secret<T> {
    /** Timestamp at which cached secret will expire. */
    cacheUntil: number;
    /** Last seen raw environment variable override value. If changed, cache is automatically invalidated. */
    lastSeenEnv?: string;
}

/** Defines an interpreter function. */
export type Interpreter<T> = (rawSecret: RawSecret) => Promise<T> | Promise<Secret<T>>

/** Defines a synchronous interpreter function. */
export type InterpreterSync<T> = (rawSecret: RawSecret) => T | Secret<T>

/** Defines an interpreter predicate function. */
export type Predicate = (rawSecret: RawSecret) => boolean;

/** Defines a synchronous interpreter predicate function. */
export type PredicateSync = (rawSecret: RawSecret) => boolean;

/** Defines an interpreter which is only run if a given condition is satisfied. */
export interface PredicatedInterpreter<T> {
    interpreter: Interpreter<T>;
    predicate?: Predicate;
}

/** Defines a synchronous interpreter which is only run if a given condition is satisfied. */
export interface PredicatedInterpreterSync<T> {
    interpreter: InterpreterSync<T>;
    predicate?: PredicateSync;
}