/**
 * Serialises structured data for `<script type="application/ld+json">`.
 *
 * `JSON.stringify` leaves `<`, `>` and `&` intact, so a value containing
 * `</script>` would close the tag early and let the rest of the string run as
 * markup. Escaping those (plus the JS line separators) keeps arbitrary
 * database text — a student's name, a course description — inert inside the
 * script element.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
