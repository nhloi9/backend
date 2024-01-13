import jwt from 'jsonwebtoken'
export const generateToken = ({ data, secret, exp }: any): string => {
  return jwt.sign(data, secret, {
    expiresIn: exp
  })
}
