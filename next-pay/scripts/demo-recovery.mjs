import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { access } from 'node:fs/promises'
import { createConnection } from 'node:net'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const origin = 'http://127.0.0.1:3110'
const demoSchema = 'nextpay_demo_recovery'
const testAccounts = [
  { email: 'customer@test.com', name: '시연 고객', role: 'CUSTOMER' },
  { email: 'merchant@test.com', name: '시연 가맹점', role: 'MERCHANT' },
  { email: 'admin@test.com', name: '시연 관리자', role: 'ADMIN' },
]

function run(args, env) {
  const child = spawn(process.execPath, args, { env, stdio: 'inherit' })
  const exited = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => resolve(code))
  })
  return { child, exited }
}

function checkResetPort() {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port: 3110 })
    socket.once('connect', () => {
      socket.destroy()
      reject(new Error('시연 서버를 종료한 뒤 npm run demo:reset을 실행해 주세요.'))
    })
    socket.once('error', (error) => {
      if (error.code === 'ECONNREFUSED') resolve()
      else reject(error)
    })
  })
}

async function seedMissingAccounts(prisma) {
  const existingAccounts = await prisma.user.findMany({
    where: { email: { in: testAccounts.map(({ email }) => email) } },
    select: { email: true },
  })
  const existingEmails = new Set(existingAccounts.map(({ email }) => email))
  const missingAccounts = testAccounts.filter(({ email }) => !existingEmails.has(email))
  if (!missingAccounts.length) return

  const testPassword = await bcrypt.hash('test1234', 12)
  for (const { email, name, role } of missingAccounts) {
    const { id: roleId } = await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    })
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: testPassword,
        roles: { create: { roleId } },
        ...(role === 'CUSTOMER' && { wallet: { create: {} } }),
      },
    })
  }
}

async function demo(reset) {
  if (!reset) {
    await access('.next/BUILD_ID').catch(() => {
      throw new Error('먼저 npm run build를 실행해 주세요.')
    })
  }
  const database = new URL(process.env.DATABASE_URL ?? '')
  if (!['postgresql:', 'postgres:'].includes(database.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
    throw new Error('시연은 로컬 PostgreSQL에서 실행해 주세요.')
  }
  if (database.searchParams.get('schema') === demoSchema) {
    throw new Error('DATABASE_URL에는 시연 전용 스키마를 지정하지 마세요.')
  }

  database.searchParams.set('schema', demoSchema)
  const env = {
    ...process.env,
    DATABASE_URL: database.href,
    AUTH_SECRET: randomBytes(32).toString('base64url'),
    AUTH_URL: origin,
    NEXTAUTH_URL: origin,
    NEXT_PAY_DEMO_RECOVERY: '1',
  }
  const prisma = new PrismaClient({ datasourceUrl: database.href })
  let server
  let stopping = false
  function stop() {
    stopping = true
    server?.child.kill()
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  process.once('disconnect', stop)
  try {
    if (reset) {
      await checkResetPort()
      if (stopping) return
      await prisma.$executeRaw`DROP SCHEMA IF EXISTS "nextpay_demo_recovery" CASCADE`
    }

    const migrate = run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'], env)
    if (await migrate.exited !== 0) throw new Error('시연 스키마 준비에 실패했습니다.')
    if (stopping) return

    await seedMissingAccounts(prisma)
    if (stopping) return
    if (reset) {
      console.log('시연 DB 초기화와 기본 계정 생성을 완료했습니다.')
      return
    }

    console.log('비밀번호 찾기: ' + origin + '/auth/forgot-password')
    console.log('시연 회원가입: ' + origin + '/auth/register')
    console.log('시연 계정: ' + testAccounts.map(({ email }) => email).join(', '))
    server = run(['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3110'], env)
    const code = await server.exited
    if (!stopping && code !== 0) throw new Error('시연 서버가 종료되었습니다.')
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
    process.off('disconnect', stop)
    await prisma.$disconnect()
  }
}

demo(process.argv.includes('--reset')).catch((error) => {
  console.error(error instanceof Error ? error.message : '복구 시연을 시작하지 못했습니다.')
  process.exitCode = 1
})
