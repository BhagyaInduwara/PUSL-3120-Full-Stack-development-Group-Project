/**
 * Split from ThemeProvider.tsx on purpose: that file is "use client", and
 * the root layout (a Server Component) needs this exact string value at
 * render time to build the no-flash inline script. A plain named export
 * from a "use client" module resolves to `undefined` when read from server
 * code — only the component export gets a real client reference; the rest
 * of the module body never executes on the server. This tiny file has no
 * "use client" directive, so both sides can import the real value safely.
 */
export const THEME_STORAGE_KEY = "flowerp:theme";
