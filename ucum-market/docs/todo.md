# 멀티벤더 쇼핑몰 개발 Todo 리스트

## Phase 1: 프로젝트 설정 및 기본 인프라

- [ ] **1.1 Next.js 프로젝트 초기화**
  - 인수기준: Next.js 14+ App Router 구조로 프로젝트 생성
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

## Phase 2: 인증 시스템 기본

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
  - 인수기준: CUSTOMER, VENDOR, ADMIN 역할 정의 및 할당
  - Playwright 테스트: 사용자 생성 시 기본 CUSTOMER 역할 할당 확인

- [ ] **2.5 세션 관리 구현**
  - 인수기준: JWT 세션 7일 만료 설정 및 자동 연장
  - Playwright 테스트: 로그인 상태 유지 및 세션 만료 시 재로그인 요구

- [ ] **2.6 기본 권한 미들웨어 구현**
  - 인수기준: 라우트 그룹별 기본 권한 검증
  - Playwright 테스트: 권한 없는 페이지 접근 시 리다이렉트 확인

## Phase 3: 상품 기본 기능

- [ ] **3.1 카테고리 모델 및 API 구현**
  - 인수기준: 카테고리 CRUD API 완성
  - Playwright 테스트: 카테고리 생성, 조회, 수정, 삭제 기능 테스트

- [ ] **3.2 상품 기본 모델 구현**
  - 인수기준: Product 모델 생성 및 기본 필드 정의
  - Playwright 테스트: 상품 데이터베이스 저장 및 조회 가능

- [ ] **3.3 상품 목록 조회 API 구현**
  - 인수기준: 페이징, 필터링, 정렬 기능 포함된 상품 목록 API
  - Playwright 테스트: 상품 목록 페이지 접근 및 데이터 표시 확인

- [ ] **3.4 상품 상세 조회 API 구현**
  - 인수기준: 상품 ID로 상세 정보 조회 가능
  - Playwright 테스트: 상품 상세 페이지 접근 및 모든 정보 표시 확인

- [ ] **3.5 상품 이미지 업로드 기능**
  - 인수기준: Cloudinary/R2 연동 및 이미지 업로드
  - Playwright 테스트: 상품 등록 시 이미지 업로드 및 표시 확인

- [ ] **3.6 상품 검색 기능**
  - 인수기준: 이름, 설명으로 상품 검색 가능
  - Playwright 테스트: 검색어 입력 시 관련 상품 필터링 확인

## Phase 4: 주문 시스템 기본

- [ ] **4.1 장바구니 기능 구현**
  - 인수기준: 상품 추가, 삭제, 수량 수정 가능
  - Playwright 테스트: 장바구니에 상품 추가 및 총 금액 계산 확인

- [ ] **4.2 주문 모델 구현**
  - 인수기준: Order, OrderItem 모델 생성 및 관계 정의
  - Playwright 테스트: 주문 데이터 생성 및 저장 가능

- [ ] **4.3 주문 생성 API 구현**
  - 인수기준: 장바구니에서 주문 생성 가능
  - Playwright 테스트: 주문 생성 시 주문 번호 발급 및 데이터 저장 확인

- [ ] **4.4 주문 목록 조회 기능**
  - 인수기준: 사용자별 주문 목록 조회 및 상태 필터링
  - Playwright 테스트: 주문 목록 페이지 접근 및 주문 상태별 필터링 확인

- [ ] **4.5 주문 상세 조회 기능**
  - 인수기준: 주문 ID로 상세 정보 및 주문 항목 조회
  - Playwright 테스트: 주문 상세 페이지에서 모든 주문 정보 표시 확인

- [ ] **4.6 주문 상태 관리**
  - 인수기준: 주문 상태 변경 (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
  - Playwright 테스트: 주문 상태 변경 및 화면 업데이트 확인

## Phase 5: 결제 시스템

- [ ] **5.1 Stripe 기본 설정**
  - 인수기준: Stripe API 키 설정 및 클라이언트 초기화
  - Playwright 테스트: Stripe 설정 로드 확인

- [ ] **5.2 체크아웃 세션 생성 API**
  - 인수기준: Stripe Checkout Session 생성 및 리다이렉트 URL 반환
  - Playwright 테스트: 결제 버튼 클릭 시 Stripe 체크아웃 페이지로 이동

- [ ] **5.3 결제 웹훅 처리**
  - 인수기준: payment_intent.succeeded, payment_intent.payment_failed 이벤트 처리
  - Playwright 테스트: 결제 성공/실패 시 주문 상태 업데이트 확인

- [ ] **5.4 결제 상태 조회**
  - 인수기준: 결제 ID로 결제 상태 및 상세 정보 조회
  - Playwright 테스트: 결제 상태 페이지에서 정보 표시 확인

- [ ] **5.5 환불 기능 구현**
  - 인수기준: Stripe API를 통한 환불 처리
  - Playwright 테스트: 환불 요청 시 환불 처리 및 상태 변경 확인

- [ ] **5.6 멀티벤더 주문 분할 로직**
  - 인수기준: 하나의 주문을 벤더별로 분할하여 OrderVendorSplit 생성
  - Playwright 테스트: 멀티벤더 주문 시 각 벤더별 분할 금액 계산 확인

## Phase 6: 재고 및 정산 관리

- [ ] **6.1 재고 모델 구현**
  - 인수기준: Inventory 모델 생성 및 재고 수량 관리
  - Playwright 테스트: 재고 데이터 생성 및 조회 가능

- [ ] **6.2 재고 현황 조회 기능**
  - 인수기준: 전체 재고, 예약된 재고, 가용 재고 조회
  - Playwright 테스트: 재고 현황 페이지에서 정확한 재고 수량 표시

- [ ] **6.3 재고 입/출고 관리**
  - 인수기준: 재고 입고 및 출고 처리
  - Playwright 테스트: 재고 입/출고 시 수량 업데이트 확인

- [ ] **6.4 상품 변형(옵션) 기능**
  - 인수기준: ProductVariant 모델로 색상, 사이즈 등 옵션 관리
  - Playwright 테스트: 상품 옵션 선택 및 재고 관리 확인

- [ ] **6.5 정산 모델 구현**
  - 인수기준: Settlement 모델 생성 및 정산 로직 구현
  - Playwright 테스트: 정산 데이터 생성 및 조회 가능

- [ ] **6.6 벤더별 정산 계산**
  - 인수기준: 수수료율을 적용한 벤더별 정산 금액 계산
  - Playwright 테스트: 정산 금액 계산 정확성 확인

- [ ] **6.7 정산 내역 조회**
  - 인수기준: 벤더별 정산 내역 및 예정 금액 조회
  - Playwright 테스트: 정산 내역 페이지에서 정산 정보 표시 확인

## Phase 7: 채팅 시스템

- [ ] **7.1 Firebase 설정**
  - 인수기준: Firebase Realtime Database 설정 및 연결
  - Playwright 테스트: Firebase 연결 상태 확인

- [ ] **7.2 채팅방 모델 구현**
  - 인수기준: ChatRoom, ChatParticipant, ChatMessage 모델 생성
  - Playwright 테스트: 채팅방 데이터 생성 및 조회 가능

- [ ] **7.3 채팅방 생성 기능**
  - 인수기준: 사용자 간 채팅방 생성 및 참여자 추가
  - Playwright 테스트: 채팅방 생성 및 참여자 목록 확인

- [ ] **7.4 실시간 메시지 송수신**
  - 인수기준: Firebase Realtime DB를 통한 실시간 메시지 전송
  - Playwright 테스트: 메시지 전송 시 실시간 수신 확인

- [ ] **7.5 채팅방 목록 조회**
  - 인수기준: 사용자별 참여 중인 채팅방 목록 조회
  - Playwright 테스트: 채팅방 목록 페이지에서 참여 중인 채팅방 표시

- [ ] **7.6 안 읽은 메시지 알림**
  - 인수기준: 안 읽은 메시지 수 및 알림 표시
  - Playwright 테스트: 새 메시지 도착 시 알림 표시 확인

- [ ] **7.7 파일/이미지 전송**
  - 인수기준: 채팅에서 이미지 및 파일 전송 가능
  - Playwright 테스트: 이미지 업로드 및 채팅에 표시 확인

## Phase 8: 추천 시스템

- [ ] **8.1 상품 조회 로깅**
  - 인수기준: ProductView 모델로 상품 조회 기록 저장
  - Playwright 테스트: 상품 조회 시 로깅 데이터 저장 확인

- [ ] **8.2 찜하기 기능 구현**
  - 인수기준: Wishlist 모델로 상품 찜 추가/제거
  - Playwright 테스트: 상품 찜 추가 및 찜 목록에서 확인

- [ ] **8.3 찜 목록 조회**
  - 인수기준: 사용자별 찜 목록 조회 및 카테고리 필터링
  - Playwright 테스트: 찜 목록 페이지에서 찜한 상품 표시

- [ ] **8.4 조회 기반 추천 알고리즘**
  - 인수기준: 최근 조회 상품 기반 유사 상품 추천
  - Playwright 테스트: 추천 상품이 조회 이력과 관련성 있는지 확인

- [ ] **8.5 구매 기반 추천 알고리즘**
  - 인수기준: 구매 이력 기반 관련 상품 추천
  - Playwright 테스트: 구매 이력 기반 추천 상품 표시

- [ ] **8.6 베스트셀러/인기 상품**
  - 인수기준: 판매량 및 조회수 기반 인기 상품 표시
  - Playwright 테스트: 인기 상품 섹션에서 데이터 정확성 확인

- [ ] **8.7 가격 변동 알림**
  - 인수기준: 찜한 상품 가격 변동 시 알림
  - Playwright 테스트: 가격 변경 시 알림 발송 확인

## Phase 9: 관리자 기능 및 고급 기능

- [ ] **9.1 관리자 대시보드**
  - 인수기준: 총 매출, 주문 수, 활성 사용자, 벤더 수 등 주요 지표 표시
  - Playwright 테스트: 대시보드 접근 및 지표 데이터 정확성 확인

- [ ] **9.2 벤더 승인 관리**
  - 인수기준: 벤더 신청 목록 조회 및 승인/거부 처리
  - Playwright 테스트: 벤더 신청 승인/거부 및 상태 변경 확인

- [ ] **9.3 상품 모니터링**
  - 인수기준: 전체 상품 목록 조회 및 부적절 상품 처리
  - Playwright 테스트: 상품 모니터링 페이지에서 상품 검토 및 비활성화

- [ ] **9.4 사용자 권한 관리**
  - 인수기준: 사용자 목록 조회 및 권한 변경, 계정 정지/활성화
  - Playwright 테스트: 사용자 권한 변경 및 계정 상태 업데이트

- [ ] **9.5 통계 및 분석 도구**
  - 인수기준: MAU/DAU, AOV, 전환율 등 플랫폼 성과 분석
  - Playwright 테스트: 통계 페이지에서 분석 데이터 표시 확인

- [ ] **9.6 보고서 다운로드**
  - 인수기준: CSV, PDF 형식으로 보고서 다운로드
  - Playwright 테스트: 보고서 다운로드 및 파일 형식 확인

- [ ] **9.7 소셜 로그인 통합**
  - 인수기준: Google, Kakao, Naver 소셜 로그인 구현
  - Playwright 테스트: 소셜 로그인 버튼 클릭 및 로그인 성공

- [ ] **9.8 2단계 인증 (2FA)**
  - 인수기준: 선택적 2FA 지원 및 설정
  - Playwright 테스트: 2FA 설정 및 로그인 시 2FA 검증

- [ ] **9.9 배송 추적 API 연동**
  - 인수기준: 배송사 API 연동 및 실시간 배송 추적
  - Playwright 테스트: 주문 상세 페이지에서 배송 추적 정보 표시

- [ ] **9.10 성능 최적화**
  - 인수기준: 이미지 최적화, 코드 분할, 캐싱 적용
  - Playwright 테스트: 페이지 로드 시간 및 성능 지표 확인

---

## 테스트 가이드라인

### Playwright 테스트 구조
```typescript
// 예시: tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('로그인 기능', () => {
  test('유효한 자격증명으로 로그인 성공', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/customer/dashboard');
    await expect(page.locator('text=환영합니다')).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인 실패', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });
});
```

### 인수기준 검증 체크리스트
- [ ] 기능이 명세서대로 작동하는가?
- [ ] 사용자 인터페이스가 직관적인가?
- [ ] 에러 처리가 적절한가?
- [ ] 성능이 허용 범위 내인가?
- [ ] 보안 요구사항이 충족되는가?
