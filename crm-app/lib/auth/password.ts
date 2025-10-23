import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(nodeScrypt)

const KEY_LENGTH = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, hash: string) {
  const [salt, storedKeyHex] = hash.split(':')
  if (!salt || !storedKeyHex) {
    return false
  }

  const storedKey = Buffer.from(storedKeyHex, 'hex')
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer

  if (storedKey.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedKey, derivedKey)
}
