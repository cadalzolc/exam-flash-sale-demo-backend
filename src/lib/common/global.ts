import { Decimal } from "@prisma/client/runtime/library";

import { format } from "date-fns";
import { TPromoStatus } from "src/types";

export const Slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-");
};

export const ExtractFromBracket = (text: string): string => {
  const matches = text.match(/\[([^\]\d][^\]]*)\]/);
  if (matches && matches.length > 0) {
    return `${matches[1]}`;
  }
  return "";
};

export const GetCurrentStamp = () => {
  const stamp = new Date().toISOString();
  const dateLocal = new Date(stamp);
  return format(dateLocal, "yyyy-MM-dd hh:mm:ss a").toUpperCase();
};

export const GetCurrentStampUTC = (): string => {
  return new Date().toISOString();
};

export const IsString = (val: any): boolean => {
  return typeof val === "string";
};

export const IsObject = (val: any): boolean => {
  return val !== null && typeof val === "object" && !Array.isArray(val);
};

export const IsArray = (val: any): val is any[] => {
  return Array.isArray(val);
};

export const IsNumber = (val: any): val is number => {
  return typeof val === "number" && !isNaN(val);
};

export const IsBoolean = (val: any): val is boolean => {
  return typeof val === "boolean";
};

export const ToNumber = (val: Decimal | null | undefined): number | null =>
  val != null ? val.toNumber() : null;

export const GetDateStatus = (start: Date, end: Date): TPromoStatus => {
  const current = new Date();
  const from = new Date(start);
  const to = new Date(end);

  if (current < from) {
    return "UPCOMING";
  }

  if (current >= from && current <= to) {
    return "ACTIVE";
  }

  return "EXPIRED";
};

export const FormatCode = (prefix: string, id: number, pad: number = 7) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const paddedId = String(id).padStart(pad, "0");

  return `${prefix}-${year}${month}${day}-${paddedId}`;
};

export const ExtractId = (code: string): number => {
  try {
    const parts = code.split("-");
    if (parts.length !== 3) {
      return 0;
    }
    const idPart = parts[2];
    return parseInt(idPart, 10);
  } catch {
    return 0;
  }
};
