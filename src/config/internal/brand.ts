/**
 * Branding symbol for `Module`. Used to discriminate a frozen module from a
 * plain `Tree` at runtime and at the type level. Not exported from the
 * package — modules are constructed exclusively via `defineModule`.
 */
export const MODULE_BRAND: unique symbol = Symbol("eslint-plugin-templates:module");
