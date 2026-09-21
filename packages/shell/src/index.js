/**
 * dsh-mywork-shell — host half.
 *
 * The theme and zoom live entirely in the browser. This no-op host entry exists so the
 * profile's Loader row resolves the package and the web shell discovers the
 * `dsh.client` bundle declared in package.json.
 */
export const name = 'dsh-mywork-shell'

export function apply() {}
