/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import { RootLayout } from "@payloadcms/next/layouts";
import { importMap } from "./admin/importMap.js";
import { serverFunction } from "./_serverFunction";
import "@payloadcms/next/css";
import "./custom.css";

import React from "react";

type Args = { children: React.ReactNode };

const Layout = ({ children }: Args) =>
  RootLayout({ children, config, importMap, serverFunction });

export default Layout;
