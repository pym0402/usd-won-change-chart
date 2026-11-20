import { spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { access } from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const origin = 'http://127.0.0.1:3110'
const sampleEmail = 'customer@nextpay-demo.invalid'
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

async function demo() {
  await access('.next/BUILD_ID').catch(() => {
    throw new Error('먼저 npm run build를 실행해 주세요.')
  })

  const database = new URL(process.env.DATABASE_URL ?? '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
    throw new Error('시연은 로컬 PostgreSQL에서 실행해 주세요.')
  }

  const schema = 'nextpay_demo_' + randomUUID().replaceAll('-', '')
  database.searchParams.set('schema', schema)
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
    const migrate = run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'], env)
    if (await migrate.exited !== 0) throw new Error('시연 스키마 준비에 실패했습니다.')
    if (stopping) return

    const testPassword = await bcrypt.hash('test1234', 12)
    for (const { email, name, role } of testAccounts) {
      const { id: roleId } = await prisma.role.create({ data: { name: role } })
      await prisma.user.create({
        data: {
          email,
          name,
          password: testPassword,
          roles: { create: { roleId } },
          ...(role === 'CUSTOMER' && {
            wallet: { create: {} },
          }),
        },
      })

      if (role === 'CUSTOMER') {
        await prisma.user.create({
          data: {
            email: sampleEmail,
            name,
            password: await bcrypt.hash(randomBytes(24).toString('base64url'), 12),
            roles: { create: { roleId } },
            wallet: { create: {} },
          },
        })
      }
    }
    if (stopping) return

    console.log('비밀번호 찾기: ' + origin + '/auth/forgot-password')
    console.log('시연 회원가입: ' + origin + '/auth/register')
    console.log('시연 계정: ' + [...testAccounts.map(({ email }) => email), sampleEmail].join(', '))
    server = run(['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3110'], env)
    const code = await server.exited
    if (!stopping && code !== 0) throw new Error('시연 서버가 종료되었습니다.')
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
    process.off('disconnect', stop)
    try {
      if (!/^nextpay_demo_[a-f0-9]{32}$/.test(schema)) throw new Error('시연 스키마 이름이 올바르지 않습니다.')
      await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE')
    } finally {
      await prisma.$disconnect()
    }
  }
}

demo().catch((error) => {
  console.error(error instanceof Error ? error.message : '복구 시연을 시작하지 못했습니다.')
  process.exitCode = 1
})
