# Next Pay(넥스트페이) 개발 Todo 리스트

## Phase 1: 프로젝트 설정 및 기본 인프라

- [ ] **1.1 Next.js 15 프로젝트 초기화**
  - 인수기준: Next.js 15 App Router 구조로 프로젝트 생성
  - Playwright 테스트: 프로젝트 루트 접근 시 기본 페이지 렌더링 확인

- [ ] **1.2 TypeScript 설정**
  - 인수기준: 엄격한 TypeScript 설정 (strict mode) 적용
  - Playwright 테스트: 타입 에러 없이 빌드 성공 확인

- [ ] **1.3 Tailwind CSS 설치 및 설정**
  - 인수기준: Tailwind CSS 기본 설정 완료 및 커스텀 테마 구성
  - Playwright 테스트: 스타일이 적용된 컴포넌트 렌더링 확인

- [ ] **1.4 Prisma 설정 및 PostgreSQL 연결**
  - 인수기준: Prisma Client 생성 및 데이터베이스 연결 성공
  - Playwright 테스트: 데이터베이스 연결 테스트 API 호출 성공

- [ ] **1.5 기본 폴더 구조 생성**
  - 인수기준: 명세서에 정의된 폴더 구조 (app, components, lib, services, types, prisma) 생성
  - Playwright 테스트: 폴더 구조 존재 확인

- [ ] **1.6 환경 변수 설정**
  - 인수기준: .env 파일에 데이터베이스, 인증, 결제 관련 환경변수 설정
  - Playwright 테스트: 환경 변수 로드 확인

- [ ] **1.7 라우트 그룹 구조 생성**
  - 인수기준: /customer, /merchant, /admin 라우트 그룹 생성
  - Playwright 테스트: 각 라우트 그룹 접근 가능 확인

## Phase 2: 인증 시스템

- [ ] **2.1 NextAuth.js 기본 설정**
  - 인수기준: NextAuth.js 설치 및 기본 설정 완료
  - Playwright 테스트: /api/auth/signin 페이지 접근 가능

- [ ] **2.2 이메일/비밀번호 로그인 구현**
  - 인수기준: 이메일과 비밀번호로 로그인 가능
  - Playwright 테스트: 유효한 자격증명으로 로그인 성공, 실패 시 에러 메시지 표시

- [ ] **2.3 회원가입 기능 구현**
  - 인수기준: 이메일, 비밀번호, 이름으로 회원가입 가능
  - Playwright 테스트: 새 사용자 계정 생성 및 로그인 가능

- [ ] **2.4 사용자 역할 시스템 구현**
  - 인수기준: CUSTOMER, MERCHANT, ADMIN 역할 정의 및 할당
  - Playwright 테스트: 사용자 생성 시 기본 CUSTOMER 역할 할당 확인

- [ ] **2.5 세션 관리 구현**
  - 인수기준: JWT 세션 3일 만료 설정 및 자동 연장
  - Playwright 테스트: 로그인 상태 유지 및 세션 만료 시 재로그인 요구

- [ ] **2.6 권한 미들웨어 구현**
  - 인수기준: 라우트 그룹별 기본 권한 검증 (CUSTOMER→/customer, MERCHANT→/merchant, ADMIN→/admin)
  - Playwright 테스트: 권한 없는 페이지 접근 시 리다이렉트 확인

## Phase 3: 포인트 및 지갑 시스템

- [ ] **3.1 Wallet 모델 구현**
  - 인수기준: Wallet 모델 생성 및 userId와 balance 필드 정의
  - Playwright 테스트: 지갑 데이터 생성 및 조회 가능

- [ ] **3.2 PointTransaction 모델 구현**
  - 인수기준: PointTransaction 모델 생성 및 거래 유형 (CHARGE, USE, REFUND, EARN) 정의
  - Playwright 테스트: 포인트 거래 데이터 생성 및 조회 가능

- [ ] **3.3 복식부기(Double-Entry) 원장 모델 구현**
  - 인수기준: LedgerEntry 모델 생성 및 계정 유형 (CASH, POINTS, REVENUE, MERCHANT, COMMISSION) 정의
  - Playwright 테스트: 원장 엔트리 생성 및 차변/대변 기록 확인

- [ ] **3.4 포인트 충전 기능 구현**
  - 인수기준: Stripe PG를 통한 포인트 충전 및 원장 기록
  - Playwright 테스트: 포인트 충전 시 지갑 잔액 증가 및 원장 엔트리 생성 확인

- [ ] **3.5 포인트 차감 기능 구현**
  - 인수기준: 결제 시 포인트 차감 및 원장 기록
  - Playwright 테스트: 포인트 사용 시 지갑 잔액 감소 및 원장 엔트리 생성 확인

- [ ] **3.6 포인트 적립 기능 구현**
  - 인수기준: 결제 완료 시 포인트 적립 (예: 1% 적립)
  - Playwright 테스트: 결제 완료 후 포인트 적립 내역 확인

- [ ] **3.7 원장 무결성 검증 구현**
  - 인수기준: 모든 원장 엔트리의 차변 합계와 대변 합계가 일치하는지 검증
  - Playwright 테스트: 무결성 검증 함수 호출 시 정상 동작 확인

- [ ] **3.8 지갑 잔액 조회 API**
  - 인수기준: 고객별 지갑 잔액 조회 API
  - Playwright 테스트: 지갑 잔액 페이지에서 정확한 잔액 표시 확인

- [ ] **3.9 포인트 거래 내역 조회 API**
  - 인수기준: 포인트 충전/차감/적립 내역 조회 및 필터링
  - Playwright 테스트: 거래 내역 페이지에서 모든 거래 표시 확인

## Phase 4: 결제 수단 관리

- [ ] **4.1 PaymentMethod 모델 구현**
  - 인수기준: PaymentMethod 모델 생성 및 결제 수단 유형 (CARD, BANK_ACCOUNT) 정의
  - Playwright 테스트: 결제 수단 데이터 생성 및 조회 가능

- [ ] **4.2 Stripe 고객(Customer) 생성**
  - 인수기준: Stripe API를 통한 고객(Customer) 생성 및 저장
  - Playwright 테스트: 고객 생성 시 Stripe Customer ID 저장 확인

- [ ] **4.3 결제 수단 등록 API (카드)**
  - 인수기준: Stripe Payment Method 생성 및 PaymentMethod 모델에 저장
  - Playwright 테스트: 카드 등록 시 마스킹 정보(last4) 저장 확인

- [ ] **4.4 결제 수단 등록 API (계좌)**
  - 인수기준: 계좌 정보 등록 및 PaymentMethod 모델에 저장
  - Playwright 테스트: 계좌 등록 시 은행명 및 계좌번호 저장 확인

- [ ] **4.5 결제 수단 목록 조회 API**
  - 인수기준: 사용자별 등록된 결제 수단 목록 조회
  - Playwright 테스트: 결제 수단 페이지에서 모든 수단 표시 확인

- [ ] **4.6 기본 결제 수단 설정 API**
  - 인수기준: 특정 결제 수단을 기본으로 설정
  - Playwright 테스트: 기본 수단 설정 시 isDefault 플래그 업데이트 확인

- [ ] **4.7 결제 수단 삭제 API**
  - 인수기준: 결제 수단 삭제 및 상태 변경 (INACTIVE)
  - Playwright 테스트: 결제 수단 삭제 시 목록에서 제거 확인

## Phase 5: 결제 시스템

- [ ] **5.1 Payment 모델 구현**
  - 인수기준: Payment 모델 생성 및 결제 상태 (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED) 정의
  - Playwright 테스트: 결제 데이터 생성 및 조회 가능

- [ ] **5.2 Stripe 기본 설정**
  - 인수기준: Stripe API 키 설정 및 클라이언트 초기화
  - Playwright 테스트: Stripe 설정 로드 확인

- [ ] **5.3 Payment Intent 생성 API**
  - 인수기준: Stripe Payment Intent 생성 및 클라이언트 시크릿 반환
  - Playwright 테스트: 결제 요청 시 Payment Intent 생성 확인

- [ ] **5.4 멱등성(Idempotency) 키 처리**
  - 인수기준: 모든 결제 요청에 고유한 idempotencyKey 생성 및 중복 요청 방지
  - Playwright 테스트: 동일한 idempotencyKey로 재요청 시 동일한 결과 반환 확인

- [ ] **5.5 결제 승인 API**
  - 인수기준: 포인트/카드 혼합 결제 지원 및 결제 상태 업데이트
  - Playwright 테스트: 결제 승인 시 Payment 상태 COMPLETED로 변경 확인

- [ ] **5.6 결제 취소 API**
  - 인수기준: 결제 취소 요청 및 Stripe 환불 처리
  - Playwright 테스트: 결제 취소 시 상태 REFUNDED로 변경 및 포인트 복구 확인

- [ ] **5.7 웹훅 서명 검증 구현**
  - 인수기준: Stripe 웹훅 서명(signature) 검증 및 위조 요청 차단
  - Playwright 테스트: 유효하지 않은 서명 요청 시 거부 확인

- [ ] **5.8 웹훅 이벤트 처리 (payment_intent.succeeded)**
  - 인수기준: 결제 성공 시 원장 엔트리 생성 및 포인트 적립
  - Playwright 테스트: 웹훅 수신 시 결제 상태 및 원장 업데이트 확인

- [ ] **5.9 웹훅 이벤트 처리 (payment_intent.payment_failed)**
  - 인수기준: 결제 실패 시 상태 변경 및 포인트 복구
  - Playwright 테스트: 웹훅 수신 시 결제 상태 FAILED로 변경 확인

- [ ] **5.10 결제 상세 조회 API**
  - 인수기준: 결제 ID로 결제 상세 정보 조회
  - Playwright 테스트: 결제 상세 페이지에서 모든 정보 표시 확인

- [ ] **5.11 결제 내역 조회 API**
  - 인수기준: 사용자별 결제 내역 조회 및 필터링
  - Playwright 테스트: 결제 내역 페이지에서 결제 목록 표시 확인

## Phase 6: 가맹점 관리

- [ ] **6.1 Merchant 모델 구현**
  - 인수기준: Merchant 모델 생성 및 가맹점 상태 (PENDING, APPROVED, REJECTED, SUSPENDED) 정의
  - Playwright 테스트: 가맹점 데이터 생성 및 조회 가능

- [ ] **6.2 MerchantApplication 모델 구현**
  - 인수기준: MerchantApplication 모델 생성 및 입점 신청 상태 (PENDING, APPROVED, REJECTED) 정의
  - Playwright 테스트: 입점 신청 데이터 생성 및 조회 가능

- [ ] **6.3 가맹점 입점 신청 API**
  - 인수기준: 사업자등록증 등 서류 정보 포함한 입점 신청
  - Playwright 테스트: 입점 신청 시 신청서 생성 및 상태 PENDING 확인

- [ ] **6.4 가맹점 신청 목록 조회 API (관리자)**
  - 인수기준: 관리자가 모든 입점 신청 목록 조회
  - Playwright 테스트: 관리자 페이지에서 신청 목록 표시 확인

- [ ] **6.5 가맹점 승인 API (관리자)**
  - 인수기준: 입점 신청 승인 및 Merchant 상태 APPROVED로 변경
  - Playwright 테스트: 승인 처리 시 가맹점 활성화 확인

- [ ] **6.6 가맹점 거부 API (관리자)**
  - 인수기준: 입점 신청 거부 및 사유 입력
  - Playwright 테스트: 거부 처리 시 상태 REJECTED로 변경 확인

- [ ] **6.7 ApiKey 모델 구현**
  - 인수기준: ApiKey 모델 생성 및 고유 키 발급
  - Playwright 테스트: API 키 데이터 생성 및 조회 가능

- [ ] **6.8 API 키 발급 API**
  - 인수기준: 가맹점별 고유 API 키 생성 및 권한 설정
  - Playwright 테스트: API 키 발급 시 고유 키 생성 확인

- [ ] **6.9 API 키 목록 조회 API**
  - 인수기준: 가맹점별 발급된 API 키 목록 조회
  - Playwright 테스트: API 키 페이지에서 모든 키 표시 확인

- [ ] **6.10 API 키 삭제 API**
  - 인수기준: API 키 삭제 및 비활성화
  - Playwright 테스트: API 키 삭제 시 목록에서 제거 확인

- [ ] **6.11 API 키 인증 미들웨어**
  - 인수기준: API 키를 통한 가맹점 인증
  - Playwright 테스트: 유효한 API 키로 API 호출 성공 확인

## Phase 7: 정산 시스템

- [ ] **7.1 MerchantSettlement 모델 구현**
  - 인수기준: MerchantSettlement 모델 생성 및 정산 상태 (PENDING, PROCESSING, COMPLETED, FAILED) 정의
  - Playwright 테스트: 정산 데이터 생성 및 조회 가능

- [ ] **7.2 수수료 계산 로직 구현**
  - 인수기준: 기본 수수료율 2.5% 적용 및 순수익(Net Amount) 계산
  - Playwright 테스트: 수수료 계산 정확성 확인 (예: 10,000원 → 수수료 250원, 순수익 9,750원)

- [ ] **7.3 복식부기 정산 로직 구현**
  - 인수기준: 정산 시 원장 엔트리 생성 (REVENUE 차변, COMMISSION 차변, MERCHANT 대변)
  - Playwright 테스트: 정산 원장 엔트리 생성 및 무결성 확인

- [ ] **7.4 결제 완료 시 정산 자동 생성**
  - 인수기준: 결제 완료 시 MerchantSettlement 자동 생성 및 수수료 계산
  - Playwright 테스트: 결제 완료 후 정산 데이터 생성 확인

- [ ] **7.5 정산 내역 조회 API (가맹점)**
  - 인수기준: 가맹점별 정산 내역 조회
  - Playwright 테스트: 가맹점 정산 페이지에서 정산 내역 표시 확인

- [ ] **7.6 정산 대시보드 구현**
  - 인수기준: 수수료 공제 후 정산 금액, 정산 예정 일정, 정산 상태 표시
  - Playwright 테스트: 정산 대시보드에서 모든 정보 표시 확인

- [ ] **7.7 입금 계좌 관리 API**
  - 인수기준: 가맹점 입금 계좌 등록/수정
  - Playwright 테스트: 입금 계좌 등록 시 정보 저장 확인

- [ ] **7.8 정산 승인 API (관리자)**
  - 인수기준: 관리자가 정산 승인 및 settledAt 업데이트
  - Playwright 테스트: 정산 승인 시 상태 COMPLETED로 변경 확인

- [ ] **7.9 정산 대기 목록 조회 API (관리자)**
  - 인수기준: 관리자가 정산 대기 내역 조회
  - Playwright 테스트: 관리자 정산 페이지에서 대기 목록 표시 확인

## Phase 8: 이상 결제 탐지 (FDS)

- [ ] **8.1 FraudDetection 모델 구현**
  - 인수기준: FraudDetection 모델 생성 및 위험 점수(riskScore), 조치(action) 필드 정의
  - Playwright 테스트: 이상 결제 탐지 데이터 생성 및 조회 가능

- [ ] **8.2 위험 점수 계산 로직 구현**
  - 인수기준: 결제 패턴 분석을 통한 위험 점수 계산 (0-100)
  - Playwright 테스트: 위험 점수 계산 함수 정상 동작 확인

- [ ] **8.3 이상 패턴 탐지 구현**
  - 인수기준: 대량 결제, 이상 IP, 단시간 다수 결제 등 패턴 탐지
  - Playwright 테스트: 이상 패턴 감지 시 riskScore 상승 확인

- [ ] **8.4 결제 차단 로직 구현**
  - 인수기준: riskScore가 임계값 이상일 경우 결제 자동 차단
  - Playwright 테스트: 높은 위험 점수 결제 요청 시 차단 확인

- [ ] **8.5 결제 승인 로직 구현**
  - 인수기준: 낮은 위험 점수 결제 요청 시 자동 승인
  - Playwright 테스트: 낮은 위험 점수 결제 요청 시 승인 확인

- [ ] **8.6 수동 검토 요청 구현**
  - 인수기준: 중간 위험 점수 결제 요청 시 수동 검토 요청
  - Playwright 테스트: 중간 위험 점수 결제 요청 시 action REVIEW 설정 확인

- [ ] **8.7 FDS 대시보드 구현**
  - 인수기준: 이상 결제 모니터링 대시보드 및 위험 점수 기반 필터링
  - Playwright 테스트: FDS 대시보드에서 이상 결제 목록 표시 확인

- [ ] **8.8 이상 결제 조치 API (관리자)**
  - 인수기준: 관리자가 결제 차단/허용 수동 결정
  - Playwright 테스트: 수동 조치 시 action 업데이트 확인

- [ ] **8.9 검토 이력 저장 구현**
  - 인수기준: 관리자의 검토 이력 (reviewedBy, reviewedAt) 저장
  - Playwright 테스트: 검토 이력 저장 확인

## Phase 9: 관리자 대시보드

- [ ] **9.1 GMV (Gross Merchandise Volume) 집계 로직**
  - 인수기준: 플랫폼 전체 거래액 집계
  - Playwright 테스트: GMV 계산 정확성 확인

- [ ] **9.2 GMV 시각화 구현**
  - 인수기준: 일/주/월별 GMV 추이 그래프
  - Playwright 테스트: 대시보드에서 GMV 그래프 표시 확인

- [ ] **9.3 수수료 수익 집계 로직**
  - 인수기준: 플랫폼 수수료 수익 집계
  - Playwright 테스트: 수수료 수익 계산 정확성 확인

- [ ] **9.4 수수료 수익 시각화 구현**
  - 인수기준: 수수료 수익 그래프 및 수수료율별 분석
  - Playwright 테스트: 대시보드에서 수수료 수익 그래프 표시 확인

- [ ] **9.5 카테고리별 거래액 비중 분석**
  - 인수기준: 카테고리별 GMV 비중 계산
  - Playwright 테스트: 카테고리별 거래액 데이터 정확성 확인

- [ ] **9.6 관리자 대시보드 통합**
  - 인수기준: GMV, 수수료 수익, 활성 가맹점 수 등 주요 지표 통합 표시
  - Playwright 테스트: 대시보드 접근 시 모든 지표 표시 확인

- [ ] **9.7 가맹점 모니터링 페이지**
  - 인수기준: 활성 가맹점 목록 및 상태 모니터링
  - Playwright 테스트: 가맹점 모니터링 페이지에서 정보 표시 확인

- [ ] **9.8 가맹점 계정 정지/활성화 API**
  - 인수기준: 관리자가 가맹점 계정 정지/활성화
  - Playwright 테스트: 계정 상태 변경 시 업데이트 확인

- [ ] **9.9 정산 승인 대시보드**
  - 인수기준: 정산 대기 목록 및 일괄 승인 기능
  - Playwright 테스트: 정산 승인 대시보드에서 목록 표시 확인

- [ ] **9.10 보고서 다운로드 기능**
  - 인수기준: GMV, 수수료 수익 등 데이터 CSV/PDF 다운로드
  - Playwright 테스트: 보고서 다운로드 및 파일 형식 확인

---

## 테스트 가이드라인

### Playwright 테스트 구조
```typescript
// 예시: tests/payment/charge.spec.ts
import { test, expect } from '@playwright/test';

test.describe('포인트 충전 기능', () => {
  test('포인트 충전 성공', async ({ page }) => {
    await page.goto('/customer/wallet');
    await page.click('button[data-testid="charge-10000"]');
    await page.fill('input[name="card-number"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=10,000원 충전 완료')).toBeVisible();
    await expect(page.locator('[data-testid="wallet-balance"]')).toContainText('10,000');
  });

  test('원장 무결성 검증', async ({ page }) => {
    // 충전 후 원장 엔트리 생성 확인
    const debitResponse = await page.evaluate(() => fetch('/api/ledger/validate'));
    const { isValid } = await debitResponse.json();
    
    expect(isValid).toBe(true);
  });
});
```

### 인수기준 검증 체크리스트
- [ ] 기능이 명세서대로 작동하는가?
- [ ] 사용자 인터페이스가 직관적인가?
- [ ] 에러 처리가 적절한가?
- [ ] 성능이 허용 범위 내인가?
- [ ] 보안 요구사항이 충족되는가?
- [ ] 복식부기 원장 무결성이 보장되는가?
- [ ] 멱등성 키가 올바르게 작동하는가?
- [ ] 웹훅 서명 검증이 올바르게 수행되는가?
