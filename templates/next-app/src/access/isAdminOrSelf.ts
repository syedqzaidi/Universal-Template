import type { Access } from 'payload'

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  if (user?.id) return { id: { equals: user.id } }
  return false
}
