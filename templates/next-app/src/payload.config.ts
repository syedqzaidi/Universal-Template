import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Pages, Media, Users } from './collections'
import { getPlugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  collections: [Pages, Media, Users],
  plugins: getPlugins(),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('PAYLOAD_SECRET is required in production') })()
    : 'dev-secret-do-not-use-in-production'),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // DATABASE_URL is set by init-project.sh with the correct port.
      // No fallback — if missing, Payload should fail immediately rather than
      // silently connecting to the wrong port.
      connectionString: process.env.DATABASE_URL || (() => {
        throw new Error(
          'DATABASE_URL is not set. Run ./scripts/init-project.sh or check your .env.local file.',
        )
      })(),
    },
  }),
})
