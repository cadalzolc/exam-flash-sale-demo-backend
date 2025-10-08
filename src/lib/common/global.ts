import { Decimal } from "@prisma/client/runtime/library";

import { format } from "date-fns";
import * as fs from "fs";
import { join } from "path";

const env = process.env.NODE_ENV || "local";

export const GetFolderUploadPath = (folder: string) => {
  const rootDir =
    env.toUpperCase() === "PRODUCTION" ? join(__dirname, "..") : process.cwd();

  const uploadPath = join(rootDir, "public", "uploads", folder);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
  }
  return uploadPath;
};

export const GetFilePath = (folder: string, fileName: string) =>
  join(GetFolderUploadPath(folder), fileName);

export const DeleteFile = (
  filePath: string,
  callback?: (error: Error | null) => void,
) => {
  fs.unlink(filePath, (error) => {
    if (error && error.code !== "ENOENT") {
      if (callback) callback(error);
    }
  });
};

export const DeleteFileInFolder = (folder: string, fileName: string) => {
  const filePath = GetFilePath(folder, fileName);
  fs.accessSync(filePath, fs.constants.R_OK);
  DeleteFile(filePath);
};

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
