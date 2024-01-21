export * from './omit'
export * from './response'
export * from './token'
export * from './multer'
export * from './firebase'

export const getStartDateOfMonth = (ago: number): Date => {
  const a = new Date()
  const year = a.getUTCFullYear()
  const month = a.getUTCMonth()
  const startMonth = new Date(Date.UTC(year, month - ago, 1))
  return startMonth
}
