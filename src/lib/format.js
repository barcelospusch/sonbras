export function number(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        useGrouping: false,
        maximumFractionDigits: digits,
      }).format(value)
    : "—";
}
export const utcDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "UTC",
      }).format(date);
};
