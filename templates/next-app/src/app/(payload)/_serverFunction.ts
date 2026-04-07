"use server";
import config from "@payload-config";
import { handleServerFunctions } from "@payloadcms/next/layouts";
import { importMap } from "./admin/importMap.js";

export const serverFunction: typeof handleServerFunctions = async (args) =>
  handleServerFunctions({ ...args, config, importMap });
