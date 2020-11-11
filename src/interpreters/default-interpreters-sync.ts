import { RawSecret, SyncInterpreter, SupportedEncoding, JSON } from '../internal/internal-types';

/** Provides a set of ready-to-use Interpreter functions for use with Container Secrets. Synchronous edition. */
export class DefaultInterpretersSync {

    /** 
     * Returns the raw data buffer as the secret contents, or undefined if the secret did not exist.
     */
    public static asBuffer(): SyncInterpreter<Buffer | undefined> {
        return (rawSecret: RawSecret) => rawSecret.data;
    }

    /** 
     * Returns a plain text string as the secret contents, or undefined if the secret did not exist.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asText(encoding: SupportedEncoding = 'utf8'): SyncInterpreter<string | undefined> {
        return (rawSecret: RawSecret) => rawSecret.data?.toString(encoding);
    }

    /** 
     * Returns a JSON object as the secret contents, or undefined if the secret did not exist or was not valid JSON.
     * @param encoding The text encoding to use. Default `utf8`.
     */
    public static asJSON(encoding: SupportedEncoding = 'utf8'): SyncInterpreter<JSON | undefined> {
        return (rawSecret: RawSecret) => {
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
    public static asTextOrJSON(encoding: SupportedEncoding = 'utf8'): SyncInterpreter<JSON | string | undefined> {
        return (rawSecret: RawSecret) => {
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