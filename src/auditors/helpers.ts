export const pluralize = (
  count: number,
  singular: string,
  plural: string,
  includeCount = true,
): string =>
  [includeCount ? count.toString() : null, count == 1 ? singular : plural]
    .filter((x) => x)
    .join(' ');
