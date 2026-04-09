import type { Access } from 'payload'

export const isAdminOrEditor: Access = ({ req: { user } }) =>
  Boolean(user?.role === 'admin' || user?.role === 'editor')
