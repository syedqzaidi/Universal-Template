import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.role === 'admin')
