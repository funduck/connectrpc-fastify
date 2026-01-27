/** Strict mode means all checks and validations are enforced and errors cause the process to exit */
export let isStrictMode = false;

export function setStrictMode(isStrict: boolean) {
  isStrictMode = isStrict;
}
