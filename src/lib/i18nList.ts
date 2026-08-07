/** `t(key, { returnObjects: true })` is loosely typed as `unknown`; this narrows
 *  it to a string array, defaulting to empty rather than throwing on a missing key. */
export const listOf = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);
