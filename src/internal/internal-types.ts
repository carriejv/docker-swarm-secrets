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
 * This object is stored by the internal cache.
 */
export interface Secret<T> extends RawSecret {
    /** The intepreted secret to store and return. */
    secret: T;
    /** Timestamp for cache expirey. */
    cacheUntil: number;
    /** Environment variable which can override the value of the secret. */
    envOverride?: string;
}

/** Defines an interpreter function. */
export type Interpreter<T> = (rawSecret: RawSecret) => Promise<T>

/** Defines a synchronous interpreter function. */
export type SyncInterpreter<T> = (rawSecret: RawSecret) => T

/** Defines an interpreter predicate function. */
export type Predicate = (rawSecret: RawSecret) => boolean;

/** Defines an interpreter which is only run if a given condition is satisfied. */
export interface PredicatedInterpreter<T> {
    interpreter: Interpreter<T>;
    predicate?: Predicate;
}

/** Defines a synchronous interpreter which is only run if a given condition is satisfied. */
export interface SyncPredicatedInterpreter<T> {
    interpreter: SyncInterpreter<T>;
    predicate?: Predicate;
}