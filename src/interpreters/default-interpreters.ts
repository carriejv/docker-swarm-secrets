import { DSSRawSecret, DSSInterpreter } from '../reader/dss-reader';

/** Encoding types supported by the default `asText` interpreter. */
export type SupportedEncoding = 'utf8' | 'utf-8' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf16-le' | 'ascii' | 'hex' | 'base64' | 'binary' | 'latin1';

/** JSON basic typing */
export type JSON = {[key: string]: string | number | boolean | Date | JSON | JSON[]};

/** Provides a set of ready-to-use Interpreter functions for use with Docker Swarm Secrets. */
export class DefaultInterpreters {

    /** Returns the raw data buffer as the secret contents, or undefined if the secret did not exist. */
    public static asBuffer(): DSSInterpreter<Buffer | undefined> {
        return (rawSecret: DSSRawSecret) => rawSecret.data;
    }

    /** 
     * Returns a plain text string as the secret contents, or undefined if the secret did not exist.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asText(encoding: SupportedEncoding = 'utf8'): DSSInterpreter<string | undefined> {
        return (rawSecret: DSSRawSecret) => rawSecret.data?.toString(encoding);
    }

    /** 
     * Returns a JSON object as the secret contents, or undefined if the secret did not exist or was not valid JSON.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asJSON(encoding: SupportedEncoding = 'utf8'): DSSInterpreter<JSON | undefined> {
        return (rawSecret: DSSRawSecret) => {
            const text = rawSecret.data?.toString(encoding);
            if(!text) {
                return undefined;
            }
            try {
                return JSON.parse(text);
            }
            catch(err) {
                return undefined;
            }
        };
    }

    /**
     * Returns a JSON object if the secret contains valid JSON, or a string if it does not. Returns undefined if the secret does not exist.
     * This interpreter provides the default behavior from `v1.x.x`.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asTextOrJSON(encoding: SupportedEncoding = 'utf8'): DSSInterpreter<JSON | string | undefined> {
        return (rawSecret: DSSRawSecret) => {
            const text = rawSecret.data?.toString(encoding);
            if(!text) {
                return undefined;
            }
            try {
                return JSON.parse(text);
            }
            catch(err) {
                return text;
            }
        };
    }
}