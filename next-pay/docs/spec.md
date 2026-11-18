# Next Pay(넥스트페이) 기술 명세서

## 1. 시스템 개요

### 1.1 프로젝트 목표
Next.js 15와 Prisma, PostgreSQL을 사용하여 네이버페이 스타일의 통합 간편결제 및 가맹점 정산 원장(Ledger) 플랫폼을 구축합니다. 고객(Customer) / 가맹점(Merchant) / 플랫폼 관리자(Admin) 3개 역할을 지원하며, 복식부기(Double-Entry) 원장 모델을 통해 결제 및 포인트 데이터의 무결성을 보장합니다.

### 1.2 기술 스택
- **프론트엔드**: Next.js 15 (App Router)
- **백엔드**: Next.js API Routes
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **인증**: NextAuth.js (RBAC)
- **결제 PG**: Stripe
- **상태 관리**: React Context / Zustand
- **스타일링**: Tailwind CSS
- **폼 관리**: React Hook Form

### 1.3 핵심 기능
- **페이 포인트 시스템**: 포인트 충전/차감 내역 관리
- **원클릭 간편결제**: 등록된 결제 수단으로 빠른 결제
- **결제 수단 관리**: 카드/계좌 등록 및 관리
- **가맹점 API 키**: 가맹점별 결제 API 키 발급
- **실시간 정산**: 수수료 공제 후 가맹점 정산 대시보드
- **GMV 시각화**: 플랫폼 전체 거래액 및 수수료 수익 분석
- **FDS**: 이상 결제 탐지 및 모니터링
- **복식부기 원장**: 모든 거래의 무결성 보장

## 2. 아키텍처 설계

### 2.1 라우트 그룹 구조
```
/app
  /customer           # 고객 페이지
    /wallet           # 페이 포인트 충전/차감 내역
    /payment          # 원클릭 간편결제 UI
    /methods          # 결제 수단(카드/계좌) 등록
    /history          # 결제 내역 및 포인트 적립 조회
  /merchant           # 가맹점 페이지
    /api-keys         # 결제 API 키 발급/관리
    /transactions     # 실시간 결제 승인/취소 내역
    /settlements      # 수수료 공제 후 정산 대시보드
  /admin              # 관리자 페이지
    /dashboard        # GMV 및 수수료 수익 시각화
    /merchants        # 가맹점 입점 승인
    /fds              # 이상 결제 탐지(FDS) 모니터링
    /settlements      # 정산 승인
  /api                # API 라우트
    /auth
    /payments
    /wallet
    /merchants
    /settlements
    /webhooks
```

### 2.2 모듈식 설계 원칙
- **역할 기반 분리**: 각 라우트 그룹은 독립적인 레이아웃과 미들웨어를 가짐
- **공통 컴포넌트**: 재사용 가능한 UI 컴포넌트는 `/components`에 통합 관리
- **API 계층화**: 비즈니스 로직은 서비스 레이어로 분리
- **타입 안전성**: TypeScript를 통한 엄격한 타입 정의

### 2.3 폴더 구조 제안
```
/
├── app/
│   ├── customer/
│   ├── merchant/
│   ├── admin/
│   └── api/
├── components/
│   ├── common/
│   ├── customer/
│   ├── merchant/
│   └── admin/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── stripe.ts
│   └── ledger.ts
├── services/
│   ├── paymentService.ts
│   ├── walletService.ts
│   ├── settlementService.ts
│   └── fraudDetectionService.ts
├── types/
├── prisma/
│   └── schema.prisma
└── docs/
    └── spec.md
```

## 3. 데이터베이스 설계 (PostgreSQL + Prisma)

### 3.1 사용자 및 권한 관리

#### User (사용자 기본 정보)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  roles         UserRole[]
  merchant      Merchant?
  wallet        Wallet?
  paymentMethods PaymentMethod[]
  pointTransactions PointTransaction[]

  @@map("users")
}
```

#### Role (역할)
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // CUSTOMER, MERCHANT, ADMIN
  description String?
  createdAt   DateTime @default(now())

  userRoles   UserRole[]

  @@map("roles")
}
```

#### UserRole (사용자-역할 연결)
```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId])
  @@map("user_roles")
}
```

### 3.2 포인트 및 지갑 시스템

#### Wallet (고객 포인트 지갑)
```prisma
model Wallet {
  id          String   @id @default(cuid())
  userId      String   @unique
  balance     Float    @default(0)
  currency    String   @default("KRW")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions PointTransaction[]

  @@map("wallets")
}
```

#### PointTransaction (포인트 거래 내역)
```prisma
model PointTransaction {
  id              String            @id @default(cuid())
  walletId        String
  type            TransactionType   // CHARGE, USE, REFUND, EARN
  amount          Float
  balanceAfter    Float
  description     String?
  referenceId     String?           // 결제 ID 등 참조 ID
  metadata        Json?
  createdAt       DateTime          @default(now())

  wallet          Wallet            @relation(fields: [walletId], references: [id], onDelete: Cascade)
  ledgerEntries   LedgerEntry[]

  @@map("point_transactions")
}
```

### 3.3 결제 수단 관리

#### PaymentMethod (결제 수단)
```prisma
model PaymentMethod {
  id              String              @id @default(cuid())
  userId          String
  type            PaymentMethodType   // CARD, BANK_ACCOUNT
  isDefault       Boolean             @default(false)
  provider        String?             // Stripe Customer ID 등
  providerMethodId String?            // Stripe Payment Method ID
  last4           String?             // 카드 마스킹 정보
  expiryMonth     Int?
  expiryYear      Int?
  bankName        String?
  bankAccount     String?
  status          PaymentMethodStatus @default(ACTIVE)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments        Payment[]

  @@map("payment_methods")
}
```

### 3.4 결제 시스템

#### Payment (결제 정보)
```prisma
model Payment {
  id                  String        @id @default(cuid())
  merchantId          String
  customerId          String
  amount              Float
  currency            String        @default("KRW")
  status              PaymentStatus @default(PENDING)
  paymentMethodId     String?
  pointAmount         Float         @default(0)     // 포인트 사용 금액
  cardAmount          Float         @default(0)     // 카드 결제 금액
  idempotencyKey      String        @unique         // 멱등성 키
  stripePaymentId     String?       @unique
  metadata            Json?
  fraudScore          Float?                         // FDS 점수
  fraudDetected       Boolean       @default(false)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  merchant            Merchant      @relation(fields: [merchantId], references: [id])
  customer            User          @relation(fields: [customerId], references: [id])
  paymentMethod       PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  settlement          MerchantSettlement?
  ledgerEntries       LedgerEntry[]

  @@map("payments")
}
```

### 3.5 가맹점 관리

#### Merchant (가맹점 정보)
```prisma
model Merchant {
  id                String          @id @default(cuid())
  userId            String          @unique
  businessName      String
  businessLicense   String?
  description       String?
  status            MerchantStatus  @default(PENDING)
  approvedAt        DateTime?
  commissionRate    Float           @default(0.025) // 2.5% 수수료
  bankAccount       String?
  bankName          String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  apiKeys           ApiKey[]
  payments          Payment[]
  settlements       MerchantSettlement[]
  application       MerchantApplication?

  @@map("merchants")
}
```

#### MerchantApplication (가맹점 입점 신청)
```prisma
model MerchantApplication {
  id          String   @id @default(cuid())
  merchantId  String   @unique
  documents   Json?    // 서류 정보
  status      ApplicationStatus @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  reason      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  merchant    Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@map("merchant_applications")
}
```

#### ApiKey (가맹점 API 키)
```prisma
model ApiKey {
  id          String    @id @default(cuid())
  merchantId  String
  key         String    @unique
  name        String
  permissions Json?     // 권한 설정
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  merchant    Merchant  @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@map("api_keys")
}
```

### 3.6 복식부기 원장 시스템

#### LedgerEntry (원장 엔트리)
```prisma
model LedgerEntry {
  id              String          @id @default(cuid())
  referenceId     String          // PointTransaction ID 또는 Payment ID
  referenceType   ReferenceType   // POINT_TRANSACTION, PAYMENT, SETTLEMENT
  accountType     AccountType     // CASH, POINTS, REVENUE, MERCHANT, COMMISSION
  debit           Float           @default(0)    // 차변
  credit          Float           @default(0)    // 대변
  description     String?
  createdAt       DateTime        @default(now())

  pointTransaction PointTransaction? @relation(fields: [referenceId], references: [id])
  payment          Payment?         @relation(fields: [referenceId], references: [id])

  @@map("ledger_entries")
}
```

#### MerchantSettlement (가맹점 정산)
```prisma
model MerchantSettlement {
  id              String              @id @default(cuid())
  merchantId      String
  paymentId       String              @unique
  grossAmount     Float               // 총 결제 금액
  commission      Float               // 수수료
  netAmount       Float               // 정산 금액
  status          SettlementStatus    @default(PENDING)
  settledAt       DateTime?
  transactionId   String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  merchant        Merchant            @relation(fields: [merchantId], references: [id])
  payment         Payment             @relation(fields: [paymentId], references: [id])
  ledgerEntries   LedgerEntry[]

  @@map("merchant_settlements")
}
```

### 3.7 이상 결제 탐지

#### FraudDetection (이상 결제 탐지 로그)
```prisma
model FraudDetection {
  id          String    @id @default(cuid())
  paymentId   String    @unique
  riskScore   Float     // 0-100, 높을수록 위험
  riskFactors Json      // 위험 요인
  action      FraudAction // ALLOW, BLOCK, REVIEW
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())

  @@map("fraud_detections")
}
```

### 3.8 열거형 정의

```prisma
enum MerchantStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TransactionType {
  CHARGE    // 포인트 충전
  USE       // 포인트 사용
  REFUND    // 환불
  EARN      // 포인트 적립
}

enum PaymentMethodType {
  CARD
  BANK_ACCOUNT
}

enum PaymentMethodStatus {
  ACTIVE
  INACTIVE
  EXPIRED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum ReferenceType {
  POINT_TRANSACTION
  PAYMENT
  SETTLEMENT
}

enum AccountType {
  CASH        // 현금 (Stripe 잔고)
  POINTS      // 포인트 (고객 지갑)
  REVENUE     // 수익 (플랫폼)
  MERCHANT    // 가맹점 (정산 대상)
  COMMISSION  // 수수료 (플랫폼 수익)
}

enum SettlementStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum FraudAction {
  ALLOW
  BLOCK
  REVIEW
}
```

## 4. 복식부기(Double-Entry) 원장 모델

### 4.1 원칙
모든 거래는 항상 대변(Credit)과 차변(Debit) 쌍으로 기록되며, 모든 원장 엔트리의 합계는 항상 0이어야 합니다.

### 4.2 계정 정의
- **CASH**: 현금 계정 (Stripe PG 잔고)
- **POINTS**: 포인트 계정 (고객 지갑)
- **REVENUE**: 수익 계정 (플랫폼 매출)
- **MERCHANT**: 가맹점 계정 (정산 대상)
- **COMMISSION**: 수수료 계정 (플랫폼 수익)

### 4.3 거래 유형별 원장 기록

#### 포인트 충전 (페이 포인트 구매)
```
차변: CASH          +10,000원
대변: POINTS        +10,000원
---------------------------
합계: 0
```

#### 포인트 사용 (결제)
```
차변: POINTS        -5,000원
대변: REVENUE       +5,000원
---------------------------
합계: 0
```

#### 카드 결제 (직불)
```
차변: CASH          +10,000원
대변: REVENUE       +10,000원
---------------------------
합계: 0
```

#### 가맹점 정산
```
차변: REVENUE       -10,000원
차변: COMMISSION    -250원   (2.5% 수수료)
대변: MERCHANT      +9,750원
---------------------------
합계: 0
```

### 4.4 원장 무결성 검증
```typescript
async function validateLedgerIntegrity() {
  const entries = await prisma.ledgerEntry.findMany();
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('원장 무결성 위반: 차변과 대변의 합이 일치하지 않습니다.');
  }
  
  return true;
}
```

## 5. 기능 명세

### 5.1 고객 페이지 기능

#### 5.1.1 페이 포인트 관리
- **포인트 충전**
  - Stripe PG를 통한 포인트 구매
  - 충전 금액 선택 (1만원, 3만원, 5만원, 10만원)
  - 충전 내역 조회
- **포인트 차감**
  - 결제 시 포인트 자동 차감
  - 차감 내역 실시간 조회
- **포인트 적립**
  - 결제 완료 시 포인트 적립 (예: 1% 적립)
  - 적립 내역 조회

#### 5.1.2 원클릭 간편결제
- **간편결제 UI**
  - 등록된 결제 수단 선택
  - 포인트/카드 혼합 결제 지원
  - 생체 인증 통한 빠른 결제
- **결제 흐름**
  1. 가맹점에서 결제 요청
  2. 결제 금액 및 수단 확인
  3. 생체 인증 또는 비밀번호 입력
  4. 결제 승인 및 완료

#### 5.1.3 결제 수단 관리
- **결제 수단 등록**
  - 신용카드 등록 (Stripe 연동)
  - 계좌 등록
  - 기본 결제 수단 설정
- **결제 수단 관리**
  - 등록된 수단 목록 조회
  - 수단 삭제/비활성화
  - 유효기간 관리

#### 5.1.4 결제 내역 조회
- **결제 내역**
  - 전체 결제 내역 조회
  - 날짜별/금액별 필터링
  - 상세 정보 표시 (가맹점, 금액, 수단)
- **포인트 적립 내역**
  - 적립/사용 내역 조회
  - 잔액 실시간 표시

### 5.2 가맹점 페이지 기능

#### 5.2.1 API 키 관리
- **API 키 발급**
  - 가맹점별 고유 API 키 생성
  - 권한 설정 (결제, 환불 등)
  - 키 만료 기간 설정
- **API 키 관리**
  - 발급된 키 목록 조회
  - 키 재발급/삭제
  - 사용 로그 확인 (마지막 사용일)

#### 5.2.2 실시간 결제 내역
- **결제 승인 내역**
  - 실시간 결제 승인 목록
  - 결제 금액, 고객 정보, 결제 수단 표시
  - 결제 상태 필터링 (승인, 취소, 실패)
- **결제 취소**
  - 결제 취소 요청
  - 취소 사유 입력
  - 환불 처리

#### 5.2.3 정산 대시보드
- **정산 내역**
  - 수수료 공제 후 정산 금액
  - 정산 예정 일정
  - 정산 상태 (대기, 처리 중, 완료)
- **수수료 계산**
  - 기본 수수료율: 2.5%
  - 거래액별 수수료 표시
  - 순수익(Net Amount) 계산
- **입금 계좌 관리**
  - 입금 계좌 등록/수정
  - 계좌 정보 확인

### 5.3 관리자 페이지 기능

#### 5.3.1 플랫폼 대시보드
- **GMV (Gross Merchandise Volume)**
  - 플랫폼 전체 거래액 시각화
  - 일/주/월별 추이 그래프
  - 카테고리별 거래액 비중
- **수수료 수익**
  - 플랫폼 수수료 수익 시각화
  - 수수료율별 수익 분석
  - 예상 수익 대비 실제 수익

#### 5.3.2 가맹점 입점 승인
- **입점 신청 목록**
  - 승인 대기 목록 조회
  - 신청서 상세 정보
  - 서류 검토
- **승인/거부 처리**
  - 승인 시 가맹점 활성화
  - 거부 시 사유 입력
  - 승인/거부 이력 관리

#### 5.3.3 이상 결제 탐지 (FDS)
- **이상 결제 모니터링**
  - 위험 점수 기반 필터링
  - 이상 패턴 탐지 (대량 결제, 이상 IP 등)
  - 실시간 알림
- **조치 관리**
  - 결제 차단/허용 결정
  - 수동 검토 요청
  - 검토 이력 저장

#### 5.3.4 정산 승인
- **정산 대기 목록**
  - 정산 대기 내역 조회
  - 가맹점별 정산 금액 확인
- **정산 승인**
  - 일괄 정산 승인
  - 개별 정산 승인
  - 정산 완료 처리

## 6. 결제 시스템 (Stripe PG 연동)

### 6.1 Stripe 통합 설계
- **결제 흐름**
  1. 고객이 결제 요청 (포인트 또는 카드)
  2. 프론트엔드에서 Stripe Payment Intent 생성
  3. 포인트 사용 시 지갑에서 차감
  4. 카드 결제 시 Stripe 결제 처리
  5. 결제 완료 후 웹훅 수신
  6. 원장 엔트리 생성 및 무결성 검증

### 6.2 멱등성(Idempotency) 처리
- **멱등성 키**
  - 모든 결제 요청에 고유한 idempotencyKey 생성
  - 중복 요청 시 동일한 결과 반환
  - 키 만료 기간: 24시간
- **구현**
  ```typescript
  const idempotencyKey = `payment_${merchantId}_${customerId}_${Date.now()}`;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'krw',
  }, {
    idempotencyKey: idempotencyKey,
  });
  ```

### 6.3 웹훅 서명 검증
- **서명 검증 필수**
  - Stripe 웹훅 서명(signature) 검증
  - 위조된 웹훅 요청 차단
- **구현**
  ```typescript
  const signature = headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  ```

### 6.4 웹훅 이벤트 처리
- **payment_intent.succeeded**: 결제 성공 처리
  - 결제 상태를 COMPLETED로 변경
  - 원장 엔트리 생성
  - 포인트 적립 (적립율 적용)
- **payment_intent.payment_failed**: 결제 실패 처리
  - 결제 상태를 FAILED로 변경
  - 포인트 복구 (이미 차감된 경우)
- **charge.refunded**: 환불 처리
  - 결제 상태를 REFUNDED로 변경
  - 환불 원장 엔트리 생성

## 7. 인증 시스템 (NextAuth.js)

### 7.1 인증 흐름
- **이메일/비밀번호 로그인**
- **역할 기반 접근 제어 (RBAC)**
  - 고객: `/customer` 라우트 접근
  - 가맹점: `/merchant` 라우트 접근
  - 관리자: `/admin` 라우트 접근

### 7.2 세션 관리
- **JWT 세션**
- **세션 만료**: 일반 세션 3일
- **중요 작업 재인증**: 결제, 권한 변경 등 중요 작업 시 재인증 요구

### 7.3 권한 검증 미들웨어
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')
  const path = request.nextUrl.pathname

  // 라우트 그룹별 권한 검증
  if (path.startsWith('/customer')) {
    // CUSTOMER 역할 확인
  } else if (path.startsWith('/merchant')) {
    // MERCHANT 역할 확인
  } else if (path.startsWith('/admin')) {
    // ADMIN 역할 확인
  }
}
```

### 7.4 API 권한 검증
모든 API 엔드포인트에서 역할 기반 권한 검증 필수:
- **인증 API**: 인증 불필요 (signin, register 등)
- **결제 API**: CUSTOMER, MERCHANT 역할 필요
- **지갑 API**: CUSTOMER 역할 필요
- **가맹점 API**: MERCHANT(자신의 정보), ADMIN(전체) 역할 필요
- **정산 API**: MERCHANT(자신의 정산), ADMIN(전체) 역할 필요
- **API 키 관리**: MERCHANT, ADMIN 역할 필요

## 8. API 설계

### 8.1 인증 API
- `POST /api/auth/signin` - 로그인
- `POST /api/auth/signout` - 로그아웃
- `POST /api/auth/register` - 회원가입

### 8.2 지갑 API
- `GET /api/wallet` - 지갑 잔액 조회
- `POST /api/wallet/charge` - 포인트 충전
- `GET /api/wallet/transactions` - 포인트 거래 내역

### 8.3 결제 API
- `POST /api/payments/create-intent` - 결제 Intent 생성
- `POST /api/payments/confirm` - 결제 승인
- `POST /api/payments/cancel` - 결제 취소
- `GET /api/payments/:id` - 결제 상세 조회
- `GET /api/payments` - 결제 내역 조회

### 8.4 결제 수단 API
- `POST /api/payment-methods` - 결제 수단 등록
- `GET /api/payment-methods` - 결제 수단 목록
- `DELETE /api/payment-methods/:id` - 결제 수단 삭제
- `PUT /api/payment-methods/:id/default` - 기본 결제 수단 설정

### 8.5 가맹점 API
- `POST /api/merchants/apply` - 가맹점 입점 신청
- `GET /api/merchants/applications` - 신청 목록 (관리자)
- `PUT /api/merchants/applications/:id/approve` - 승인 (관리자)
- `PUT /api/merchants/applications/:id/reject` - 거부 (관리자)
- `POST /api/merchants/api-keys` - API 키 발급
- `GET /api/merchants/api-keys` - API 키 목록
- `DELETE /api/merchants/api-keys/:id` - API 키 삭제

### 8.6 정산 API
- `GET /api/settlements` - 정산 내역 조회
- `GET /api/settlements/:id` - 정산 상세 조회
- `POST /api/settlements/:id/approve` - 정산 승인 (관리자)

### 8.7 웹훅 API
- `POST /api/webhooks/stripe` - Stripe 웹훅 처리

## 9. 보안 고려사항

### 9.1 데이터 보안
- **민감 정보 암호화**: 비밀번호, 결제 정보
- **비밀번호 해싱**: bcrypt (cost factor 12+) 사용
- **HTTPS 적용**: 모든 통신 암호화
- **SQL Injection 방지**: Prisma ORM 사용
- **XSS 방지**: 입력값 검증 및 이스케이프
- **민감 정보 로깅 제외**: 비밀번호, 결제 정보, 개인정보는 로그에 기록하지 않음

### 9.2 결제 보안
- **PCI DSS 준수**: 카드 정보는 Stripe에 저장, 시스템에 카드 데이터 직접 저장 금지
- **웹훅 서명 검증**: 모든 웹훅 요청 서명 검증 필수
- **멱등성 키**: 중복 결제 방지
- **결제 금액 검증**: 서버에서 금액 재검증
- **이상 결제 탐지**: FDS를 통한 의심 결제 차단

### 9.3 API 보안
- **API 키 관리**: 가맹점별 고유 API 키 발급
- **Rate Limiting**: API 호출 제한
- **IP 화이트리스트**: 선택적 IP 접근 제한
- **로그 모니터링**: 비정상적인 API 호출 감지

### 9.4 인증 보안
- **비밀번호 정책**: 최소 8자, 영문+숫자+특수문자
- **로그인 시도 제한**: 5회 실패 시 계정 잠금 (15분 후 자동 해제)
- **세션 관리**: 세션 만료 및 재인증
