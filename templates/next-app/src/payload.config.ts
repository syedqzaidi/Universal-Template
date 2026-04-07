import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "",
  collections: [
    {
      slug: "pages",
      admin: { useAsTitle: "title" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "content", type: "richText" },
        { name: "status", type: "select", options: ["draft", "published"], defaultValue: "draft" },
      ],
    },
    // Media uploads use local disk storage by default.
    // For production (Vercel/serverless), add a cloud storage adapter:
    //   pnpm add @payloadcms/storage-s3        (for AWS S3 / Supabase Storage)
    //   pnpm add @payloadcms/storage-vercel-blob (for Vercel Blob)
    // Then add the plugin to the plugins array in this config.
    // See: https://payloadcms.com/docs/upload/storage-adapters
    {
      slug: "media",
      upload: true,
      fields: [
        { name: "alt", type: "text", required: true },
      ],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("PAYLOAD_SECRET is required in production"); })()
    : "dev-secret-do-not-use-in-production"),
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: {
      // DATABASE_URL is set by init-project.sh with the correct port.
      // No fallback — if missing, Payload should fail immediately rather than
      // silently connecting to the wrong port.
      connectionString: process.env.DATABASE_URL || (() => {
        throw new Error(
          "DATABASE_URL is not set. Run ./scripts/init-project.sh or check your .env.local file."
        );
      })(),
    },
  }),
});
