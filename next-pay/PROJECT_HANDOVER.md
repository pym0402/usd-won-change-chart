# Next Pay 프로젝트 핸드오버 문서

## 📋 프로젝트 개요

**Next Pay**는 복식부기 원장 기반의 차세대 통합 간편결제 및 가맹점 정산 플랫폼입니다. 네이버페이 스타일의 간편결제 시스템을 구현하며, 포인트 충전/사용, 카드 결제, 가맹점 정산, FDS(사기 탐지 시스템) 등의 기능을 포함합니다.

---

## 🛠 기술 스택

### 프론트엔드
- **Framework**: Next.js 16.3.8 (App Router)
- **Language**: TypeScript 7.0.2
- **Styling**: Tailwind CSS 4.3.3
- **UI Components**: 
  - lucide-react (아이콘)
  - tailwind-merge, clsx (클래스 유틸리티)
  - canvas-confetti (애니메이션)
- **Charts**: Recharts 3.10.1
- **Stripe**: @stripe/react-stripe-js, @stripe/stripe-js

### 백엔드
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL (Prisma ORM 5.22.0)
- **Authentication**: NextAuth.js 5.0.0-beta.32
- **Payment**: Stripe 23.0.0
- **Password Hashing**: bcryptjs 3.0.3

### 개발 도구
- **Testing**: Playwright 1.63.0
- **Package Manager**: npm
- **Code Style**: camelCase 변수명, 소문자 동사로 시작하는 함수명

---

## 📁 폴더 구조

```
next-pay/
├── app/                          # Next.js App Router
│   ├── admin/                    # 관리자 페이지
│   ├── api/                      # API Routes
│   │   ├── admin/                # 관리자 API
│   │   ├── auth/                 # 인증 API (NextAuth)
│   │   ├── ledger/               # 원장 조회 API
│   │   ├── merchant/             # 가맹점 API
│   │   ├── merchants/            # 가맹점 관리 API
│   │   ├── payment-methods/      # 결제 수단 API
│   │   ├── payments/             # 결제 API
│   │   ├── settlements/          # 정산 API
│   │   └── wallet/               # 지갑 API
│   ├── auth/                     # 인증 페이지 (로그인, 회원가입)
│   ├── customer/                 # 고객 페이지
│   │   ├── layout.tsx            # 고객 포털 레이아웃 (조건부 네비게이션)
│   │   ├── page.tsx              # 고객 대시보드 (4개 카테고리 카드)
│   │   ├── wallet/               # 내 지갑 페이지
│   │   ├── payments/             # 결제 테스트 페이지
│   │   ├── payment-methods/      # 결제 수단 관리 페이지
│   │   └── transfer/             # 송금/선물 페이지
│   ├── merchant/                 # 가맹점 페이지
│   ├── page.tsx                  # 메인 홈 화면 (3대 포털 카드)
│   ├── layout.tsx                # 루트 레이아웃
│   └── globals.css               # 전역 스타일
├── components/                   # 재사용 컴포넌트
│   └── ui/                       # UI 컴포넌트 (Button, Toast, Modal 등)
├── lib/                          # 유틸리티 라이브러리
│   ├── auth.ts                   # NextAuth 설정
│   └── prisma.ts                 # Prisma 클라이언트
├── prisma/                       # Prisma 설정
│   ├── schema.prisma             # DB 스키마
│   └── seed.ts                   # 시드 데이터
├── services/                     # 비즈니스 로직 서비스
│   ├── fraudDetectionService.ts  # FDS 서비스
│   ├── merchantService.ts        # 가맹점 서비스
│   ├── paymentMethodService.ts   # 결제 수단 서비스
│   ├── paymentService.ts         # 결제 서비스
│   ├── settlementService.ts      # 정산 서비스
│   └── walletService.ts          # 지갑 서비스
├── middleware.ts                 # 라우팅 권한 미들웨어
├── package.json
└── .env                          # 환경 변수 (DATABASE_URL, NEXTAUTH_SECRET, STRIPE_SECRET_KEY 등)
```

---

## 🗄 DB 스키마 원리 (복식부기 원장)

### 핵심 모델

#### 1. Wallet & PointTransaction (고객 지갑)
- **Wallet**: 고객별 포인트 잔액 관리
- **PointTransaction**: 포인트 거래 내역
  - `TransactionType`: CHARGE(충전), USE(사용), REFUND(환불), EARN(적립), TRANSFER_OUT/IN(송금)
  - 복식부기 원장 기록 포함

#### 2. Payment (결제)
- 결제 생성/승인/취소/환불 관리
- `pointAmount`: 포인트 사용 금액
- `cardAmount`: 카드 결제 금액
- `status`: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
- FDS 점수 및 사기 탐지 결과 포함

#### 3. LedgerEntry (복식부기 원장)
- **AccountType**:
  - `CASH`: 현금 (Stripe 잔고)
  - `POINTS`: 포인트 (고객 지갑)
  - `REVENUE`: 수익 (플랫폼)
  - `MERCHANT`: 가맹점 (정산 대상)
  - `COMMISSION`: 수수료 (플랫폼 수익)
- **복식부기 원칙**: 차변(Debit) = 대변(Credit) 항상 성립
- **ReferenceType**: POINT_TRANSACTION, PAYMENT, SETTLEMENT

#### 4. Merchant & MerchantSettlement (가맹점 정산)
- **Merchant**: 가맹점 정보, 수수료율(commissionRate, 기본 2.5%)
- **MerchantSettlement**: 결제별 정산 내역
  - `grossAmount`: 총 결제 금액
  - `commission`: 수수료
  - `netAmount`: 정산 금액

#### 5. FraudDetection (FDS)
- `riskScore`: 0-100 (높을수록 위험)
- `action`: ALLOW, BLOCK, REVIEW
- `riskFactors`: 위험 요인 (JSON)

---

## 🔌 전체 API 목록

### 인증 API (`/api/auth/*`)
- NextAuth.js 기반 (로그인, 회원가입, 세션 관리)

### 지갑 API (`/api/wallet/*`)
- `GET /api/wallet` - 지갑 조회
- `POST /api/wallet/charge` - 포인트 충전
- `GET /api/wallet/transactions` - 거래 내역 조회

### 결제 수단 API (`/api/payment-methods/*`)
- `GET /api/payment-methods` - 결제 수단 목록
- `POST /api/payment-methods` - 결제 수단 등록
- `DELETE /api/payment-methods/[id]` - 결제 수단 삭제

### 결제 API (`/api/payments/*`)
- `GET /api/payments` - 결제 내역 조회
- `POST /api/payments/create-intent` - Payment Intent 생성
- `POST /api/payments/confirm` - 결제 승인
- `POST /api/payments/[id]/cancel` - 결제 취소/환불
- `POST /api/payments/webhook` - Stripe 웹훅

### 가맹점 API (`/api/merchants/*`)
- `GET /api/merchants` - 가맹점 목록
- `POST /api/merchants` - 가맹점 등록
- `PUT /api/merchants/[id]` - 가맹점 수정

### 정산 API (`/api/settlements/*`)
- `GET /api/settlements` - 정산 내역 조회
- `POST /api/settlements` - 정산 생성

### 원장 API (`/api/ledger/*`)
- `GET /api/ledger` - 원장 내역 조회
- `GET /api/ledger/balance` - 계정별 잔액 조회

### 관리자 API (`/api/admin/*`)
- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/users` - 사용자 목록
- `GET /api/admin/payments` - 전체 결제 내역

---

## ⚠️ UI 수정 시 절대 건드리면 안 되는 백엔드 주의사항

### 1. 라우팅 권한 미들웨어 (`middleware.ts`)
- **수정 금지**: 라우트 그룹별 권한 검증 로직
- `/customer` → CUSTOMER 역할 필요
- `/merchant` → MERCHANT 역할 필요
- `/admin` → ADMIN 역할 필요
- 인증되지 않은 사용자는 홈페이지로 리다이렉트

### 2. 세션 인증 (`lib/auth.ts`)
- **수정 금지**: NextAuth 설정, 세션 쿠키, JWT 설정
- 환경 변수: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### 3. DB 스키마 (`prisma/schema.prisma`)
- **수정 금지**: 복식부기 원장 구조, Enum 값, 관계 정의
- 스키마 변경 시 반드시 마이그레이션 필요: `npx prisma migrate dev`

### 4. 핵심 비즈니스 로직 (services/*)
- **수정 금지**: 복식부기 원장 기록 로직, 트랜잭션 처리
  - `walletService.chargePoints()` - 충전 시 원장 기록
  - `walletService.usePoints()` - 사용 시 원장 기록
  - `walletService.earnPoints()` - 적립 시 원장 기록
  - `paymentService.createLedgerEntriesForPayment()` - 결제 원장 기록
- **수정 금지**: 포인트 잔액 검증 로직 (잔액 부족 시 에러)

### 5. 결제 로직 (`services/paymentService.ts`)
- **수정 금지**: Stripe Payment Intent 생성, 멱등성 키 처리
- **수정 금지**: FDS 검사 및 차단 로직
- **수정 금지**: 포인트 사용 처리 (`usePoints` 호출)
- **수정 금지**: 포인트 적립 처리 (1% 리워드)

### 6. 환경 변수 (`.env`)
- **수정 금지**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## 🎨 UI 수정 가이드라인

### 프론트엔드만 수정 가능한 영역
- `app/customer/page.tsx` - 고객 대시보드 카드 UI
- `app/customer/wallet/page.tsx` - 지갑 페이지 UI (화면 표시만)
- `app/customer/payments/page.tsx` - 결제 테스트 페이지 UI
- `app/merchant/page.tsx` - 가맹점 대시보드 UI
- `app/admin/page.tsx` - 관리자 대시보드 UI
- `app/page.tsx` - 메인 홈 화면 UI
- `components/ui/*` - UI 컴포넌트 스타일

### UI 디자인 규칙
- **변수명**: camelCase
- **함수명**: 소문자 동사로 시작
- **스타일**: Tailwind CSS 사용
- **아이콘**: lucide-react 사용
- **색상**: Indigo/Blue 계열 기본 (핀테크 스타일)

---

## 🚀 실행 명령어

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# DB 마이그레이션
npx prisma migrate dev

# 시드 데이터 실행
npm run seed

# Prisma Studio (DB GUI)
npx prisma studio
```

---

## 📝 최근 UI 수정 내역

### 1. 메인 홈 화면 (`app/page.tsx`)
- 서브 타이틀: "차세대 통합 간편결제 및 가맹점 정산 원장 플랫폼"
- 3대 포털 카드: 고객 페이지(`/customer`), 가맹점 페이지(`/merchant`), 관리자 페이지(`/admin`)
- 그리드 레이아웃, hover 효과, 그라데이션 아이콘

### 2. 고객 포털 레이아웃 (`app/customer/layout.tsx`)
- 상단 네비게이션: "고객용 대시보드" 버튼 조건부 숨김 (`usePathname`)
- `/customer` 경로일 때 버튼 숨김, 하위 페이지에서만 표시

### 3. 고객 대시보드 (`app/customer/page.tsx`)
- 4개 카테고리 카드 (2x2 그리드):
  - 내 지갑 (`/customer/wallet`)
  - 간편결제 (`/customer/payments`)
  - 결제 수단 (`/customer/payment-methods`)
  - 송금/선물 (`/customer/transfer`)

### 4. 내 지갑 (`app/customer/wallet/page.tsx`)
- 거래 내역 표시: CHARGE, USE, EARN, REFUND 타입 모두 표시
- 색상 구분: 충전/리워드/환불(초록색), 사용(빨간색)
- 충전 완료 후 거래 내역 실시간 갱신

### 5. 결제 테스트 (`app/customer/payments/page.tsx`)
- 결제 수단 드롭다운 문구: "새 카드로 직접 결제 (Stripe 결제창 호출)"
- 최근 결제 결과 박스: 결제 ID, 총 금액, 사용 포인트, 남은 잔액, 적립 리워드, 상태
- 등록된 결제 수단 선택 시 자동 결제 승인
- 포인트 사용 시 실시간 지갑 잔액 차감 및 원장 기록

---

## 🔑 환경 변수 (`.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/next_pay
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📞 연락처 및 참고

- 프로젝트 루트: `C:\Temp\AI_WS\next-pay`
- DB: PostgreSQL (Prisma)
- 문서: `docs/` 폴더
- 테스트: `tests/` 폴더

---

## 2026-11-20 작업 인수인계

### 메인 홈 UI 개편 완료

- `app/page.tsx`에서 Next Pay 소개, 카드 결제·포인트 적립 예시, 고객·가맹점·관리자 포털 진입 카드를 새로 배치했다. 결제 금액과 적립 포인트는 화면 예시다.
- `app/home.module.css`에 홈 전용 스타일을 추가했다. 상단 내비게이션 보정은 홈에만 적용되며, 포털 카드는 데스크톱에서 3열, 모바일에서 1열로 표시된다. 키보드 포커스와 모션 감소 설정도 반영했다.
- `tests/phase1.spec.ts`의 홈 테스트를 갱신했다. 포털 링크 경로, 모바일 로그인·회원가입 버튼과 결제 예시 표시, 가로 넘침 여부를 확인한다.
- 기존 `auth()` 세션 판정과 비로그인 상태에서만 홈 본문에 인증 버튼을 표시하는 조건을 유지했다. 인증·포털 링크, 백엔드 API, 상태 관리, Prisma 스키마는 기존 구현을 사용한다.

### 검증 결과

- 기존 로컬 개발 서버(`http://localhost:5000`)에서 홈 관련 Playwright 테스트 2개가 통과했다. 화면 너비 320·390·768·900·1440px에서 가로 넘침과 결제 예시 잘림이 없는지 확인했고, 로그인·회원가입 화면 이동과 세 포털 링크 경로도 확인했다.
- 전체 TypeScript 검사(`tsc --noEmit --incremental false`)는 기존 관리자 화면, 관리자 API 라우트, 이상 결제 탐지 서비스, 결제 서비스의 타입 오류로 실패했다. 홈 변경 파일에서는 타입 오류가 보고되지 않았다.

### 2026-11-21 이어서 진행할 작업

1. 고객 대시보드(`app/customer/page.tsx`)의 내 지갑·간편결제·결제 수단·송금/선물 카드에 홈의 간격, 글자 크기, 포커스 스타일을 적용한다. 네 카드의 기존 링크를 유지하고 모바일에서 탐색 순서를 확인한다.
2. 가맹점 대시보드(`app/merchant/page.tsx`)에서 정산 요약과 추이 차트의 정보 우선순위를 정리한다. 정산 내역, API 키 관리, SDK 연동 가이드에 접근하는 기존 동작을 유지한다.
3. 관리자 대시보드(`app/admin/page.tsx`)에서 핵심 지표, 정산 승인 대기 목록, 이상 결제(FDS) 검토 영역의 가독성을 개선한다. 정산 승인과 FDS 조치의 기존 핸들러를 유지한다.

세 대시보드 모두 표현 계층을 중심으로 수정한다. 기존 인증·권한, API 호출, 상태 관리 및 처리 흐름을 유지하고, 역할별 계정으로 주요 링크와 기존 동작을 검증한다.
