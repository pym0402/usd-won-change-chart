import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 기본 역할 생성
  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: '일반 고객'
    }
  })

  const merchantRole = await prisma.role.upsert({
    where: { name: 'MERCHANT' },
    update: {},
    create: {
      name: 'MERCHANT',
      description: '가맹점'
    }
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: '관리자'
    }
  })

  console.log('기본 역할이 생성되었습니다:', { customerRole, merchantRole, adminRole })

  // 테스트용 사용자 생성
  const hashedPassword = await bcrypt.hash('test1234', 10)

  // 관리자 계정
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: '관리자',
      password: hashedPassword,
      roles: {
        create: { roleId: adminRole.id }
      }
    }
  })

  // 가맹점 계정
  const merchantUser = await prisma.user.upsert({
    where: { email: 'merchant@test.com' },
    update: {},
    create: {
      email: 'merchant@test.com',
      name: '가맹점',
      password: hashedPassword,
      roles: {
        create: { roleId: merchantRole.id }
      }
    }
  })

  // 고객 계정
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      name: '고객',
      password: hashedPassword,
      roles: {
        create: { roleId: customerRole.id }
      }
    }
  })

  console.log('테스트용 사용자가 생성되었습니다:')
  console.log('관리자: admin@test.com / test1234')
  console.log('가맹점: merchant@test.com / test1234')
  console.log('고객: customer@test.com / test1234')

  // 테스트용 가맹점 생성
  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: {
      userId: merchantUser.id,
      businessName: '롯데백화점',
      businessLicense: '123-45-67890',
      description: '테스트용 가맹점',
      status: 'APPROVED',
      commissionRate: 0.025
    }
  })

  console.log('테스트용 가맹점이 생성되었습니다:', merchant.businessName)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
