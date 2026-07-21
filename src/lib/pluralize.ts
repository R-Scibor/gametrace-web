/**
 * Polish plural selection. Polish nouns have three count forms:
 *  - "one": exactly 1 (e.g. "1 sesja")
 *  - "few": ends in 2-4, except when the number ends in 12-14 (e.g. "2 sesje", "22 sesje")
 *  - "many": everything else, including 0 and the 12-14 exception (e.g. "0 sesji", "5 sesji", "12 sesji")
 *
 * `forms` is `[one, few, many]`. Returns the matching form for `count`.
 */
export function plPlural(count: number, forms: [string, string, string]): string {
  const [one, few, many] = forms;
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (count === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

/** Polish plural for "sesja/sesje/sesji", formatted as "<count> <form>". */
export function sessionsLabel(count: number): string {
  return `${count} ${plPlural(count, ['sesja', 'sesje', 'sesji'])}`;
}
