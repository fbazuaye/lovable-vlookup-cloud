/**
 * Text & Clean utility functions
 */

export const cleanText = (value: string): string =>
  value.replace(/[^\x20-\x7E]/g, "");

export const trimText = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

export const toProper = (value: string): string =>
  value
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());

export const toUpper = (value: string): string => value.toUpperCase();

export const toLower = (value: string): string => value.toLowerCase();

export const padZeros = (value: string, length: number): string =>
  value.padStart(length, "0");

export const substituteText = (
  value: string,
  find: string,
  replacement: string
): string => {
  if (!find) return value;
  return value.split(find).join(replacement);
};

export const replaceAtPosition = (
  value: string,
  start: number,
  length: number,
  newText: string
): string => {
  if (start < 0 || start >= value.length) return value;
  return value.substring(0, start) + newText + value.substring(start + length);
};

export const removeLeadingZeros = (value: string): string =>
  value.replace(/^0+(?=\d)/, "");

export const removeAllZeros = (value: string): string =>
  value.replace(/0/g, "");

export type TextOperation =
  | "clean"
  | "trim"
  | "proper"
  | "upper"
  | "lower"
  | "padZeros"
  | "substitute"
  | "replace"
  | "removeLeadingZeros"
  | "removeAllZeros";

export const applyTextOperation = (
  data: Record<string, any>[],
  column: string,
  operation: TextOperation,
  options?: {
    find?: string;
    replacement?: string;
    start?: number;
    length?: number;
    padLength?: number;
  }
): Record<string, any>[] => {
  return data.map((row) => {
    const val = String(row[column] ?? "");
    let newVal: string;

    switch (operation) {
      case "clean":
        newVal = cleanText(val);
        break;
      case "trim":
        newVal = trimText(val);
        break;
      case "proper":
        newVal = toProper(val);
        break;
      case "upper":
        newVal = toUpper(val);
        break;
      case "lower":
        newVal = toLower(val);
        break;
      case "padZeros":
        newVal = padZeros(val, options?.padLength ?? 5);
        break;
      case "substitute":
        newVal = substituteText(val, options?.find ?? "", options?.replacement ?? "");
        break;
      case "replace":
        newVal = replaceAtPosition(val, options?.start ?? 0, options?.length ?? 1, options?.replacement ?? "");
        break;
      case "removeLeadingZeros":
        newVal = removeLeadingZeros(val);
        break;
      case "removeAllZeros":
        newVal = removeAllZeros(val);
        break;
      default:
        newVal = val;
    }

    return { ...row, [column]: newVal };
  });
};
