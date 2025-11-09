# 한밭대학교 컴퓨터공학과 TaBi팀

**팀 구성**

- 20201919 채성수 (팀장)
- 20201761 김영권

## <u>TaBi</u> Project Background

- ### 필요성

  - **수동적 여행의 전환**: 남이 만든 코스를 그대로 따라가는 피상적 소비에서 벗어나, 앱에서 **퀘스트(미션)**를 받아 **현장에서 단계별로 수행**하는 경험을 제공한다. 사용자는 “보고-저장”이 아니라 **직접 플레이**하여 행동을 유도한다.
  - **계획 비용 절감·즉시 실행**: 코스 설계에 드는 시간/노력을 줄이기 위해, 파급력이 뛰어난 sns를 활용해 여행 계획 속 **퀘스트 단위의 콘텐츠를 즉시 탐색·선택·실행**할 수 있게 했다. 프론트는 **퀘스트 실행 흐름 및 sns UI**를 제공하고, 백엔드는 공유/재사용을 위한 구조를 갖춰 사용자의 정보 접근성을 높인다.
  - **재방문 동기 부여**: 동일 지역도 **퍼즐/보물찾기/수집 및 보상**으로 다른 루트를 제공할 수 있어, 한 번 가본 곳에서도 **새 미션으로 다시 즐길 이유**를 만든다.
  - **커뮤니티 기반 확산**: 팔로우/프로필을 통해 **제작자(현지인·크리에이터) → 사용자**로 퀘스트가 순환 공유되며, “좋아요/댓글(알림)” 등 SNS 요소로 **참여 유지**를 돕는다.

- ### 기존 해결책의 문제점

  - **코스는 있는데 ‘행동’이 없다**

    - 블로그/피드는 장소 리스트일 뿐, 현장에서 “지금 여기서 뭘 해?”가 비어 있다. 순서·조건·분기 없는 추천은 모호함으로 귀결된다.
    - **TaBi의 관점**: 코스를 **퀘스트 → 러닝 로케이션 → 액션**과 **보물찾기 요소**로 쪼개 **즉시 실행 가능한 행동 단위**를 제공한다.

  - **앱 왕복이 ‘실행 마찰’을 만든다**

    - 기존 흐름은 “후기 탐색 → 지도 북마크 → 일정 짜기”의 반복으로, 사용자가 실행 전에 이미 피로해진다. 정보 소비와 실제 행동 사이에 **계획 작성**이라는 큰 장벽이 있다.
    - **TaBi의 관점**: 여행 계획을 **게임적 요소(ex. quest/treasurehunt)**로 외부화(패키징)한다. 사용자는 SNS에서 **공유된 퀘스트를 바로 수신**하고, 앱에서 **스텝(Action)·힌트·완료 조건**이 정리된 형태로 **즉시 플레이**한다. 즉, 사용자가 따로 계획을 세울 필요 없이 **“받고-바로 수행”**으로 전환되어 실행 마찰이 크게 줄어든다.

  - **1회성 소비라 ‘재방문 동기’가 없다**

    - 동일 코스를 한 번 돌면 끝. 변주·도전·수집 없이 기억만 남고, 서비스로의 복귀 이유가 사라진다.
    - **TaBi의 관점**: **퍼즐/보물찾기/수집**으로 루트를 바꿔 **리플레이어빌리티**를 설계한다.

  - **창작–소비 루프가 닫히지 않는다**
    - 좋은 코스가 개인 블로그에 갇혀 확산이 느리고, 이용자는 새 콘텐츠를 꾸준히 찾기 어렵다. 제작 동기 또한 약하다.
    - **TaBi의 관점**: **SNS형 공유/팔로우** 구조로 퀘스트를 순환시키고, 제작자–사용자 간 **발견→실행→피드백** 루프를 만든다.

## System Design

- ### System Requirements (Backend)

  - **Runtime & Language**

    - Java **19**(Toolchain 고정), UTF-8, Timezone **Asia/Seoul**
    - Spring Boot **3.5.3**, Gradle (io.spring.dependency-management **1.1.7**)

  - **Core Frameworks**

    - Spring Web (REST), Spring Validation
    - Spring Data JPA (Hibernate)

  - **Database**

    - PostgreSQL (Supabase Hosting)
    - JDBC 드라이버: `org.postgresql:postgresql` (runtimeOnly)

  - **Security**

    - Spring Security 6
    - JWT 인증: `jjwt 0.12.6` (api/impl/jackson), Bearer 토큰 방식

  - **API 규약**

    - RESTful JSON

  - **Documentation**

    - OpenAPI/Swagger (`springdoc-openapi-starter-webmvc-ui:2.6.0`)
    - 예시 요청/응답 포함

  - **Build & Dev**

    - Lombok(compileOnly/annotationProcessor), Devtools(developmentOnly)
    - IDE: IntelliJ

  - **API Testing**

    - Postman

  - **Deployment**
    - Cloudtype
    - Github Action: 코드 통합 → 테스트 → 푸시(CI) 및 테스트 빌드 → 테스트 → 배포 파이프라인(CD)

---

- ### System Requirements (Frontend)

  - #### **Runtime & Language**

    - React Native (iOS / Android 동시 지원)
    - JavaScript (ES2019+) 및 TypeScript
    - UTF-8 인코딩, Timezone **Asia/Seoul** 기준

  - #### **Core Frameworks & Navigation**

    - **React Navigation**
      - `@react-navigation/native`
      - `@react-navigation/native-stack`
      - Tab + Stack 혼합 구조 (메인 탭: Play / Create / Profile)
    - `react-native-safe-area-context` — 노치, 제스처 영역 대응
    - `react-native-gesture-handler`, `react-native-reanimated` — 제스처 및 애니메이션 구현

  - #### **UI / UX**

    - `react-native-vector-icons` — Ionicons 아이콘 세트 사용
    - `react-native-linear-gradient` — 그라데이션 배경 / 버튼 디자인
    - `react-native-modalize` — 하단 슬라이드 모달(CommentModal, 상세뷰 등)
    - `react-native-draggable-flatlist` — 드래그 기반 순서 변경
    - `react-native-swipeable-item` — 댓글 삭제 / 슬라이드 액션
    - 글라스모피즘 카드 스타일, 플로팅 레이블 애니메이션 입력폼, 반응형 레이아웃 지원

  - #### **Data & API Handling**

    - `axios` 기반 `axiosInstance` 사용
    - RESTful JSON API 연동
      - `/api/quest-post/list/{page}` — 퀘스트 포스트 목록 조회
      - `/api/quest/creation` — 퀘스트 생성
      - `/api/treasure-hunt-post/read-ten` — 보물찾기 피드 조회
    - 공통 에러 핸들링(`normError`) 적용

  - #### **Local Storage & Session**

    - `@react-native-async-storage/async-storage`
      - `currentQuestId`, `currentQuestPostId`, `quest_final_data` 등 상태 저장
      - 사용자 진행 중 퀘스트 및 임시 데이터 유지

  - #### **State Management**

    - React Context API 기반 글로벌 상태 관리
      - `AuthProvider`, `SignUpProvider` — 인증 및 회원가입 단계 관리
      - `QuestLocationProvider` — 퀘스트 위치 정보 관리
      - `ActionTimelineProvider` — 타임라인 및 액션 흐름 관리
      - `TreasureProvider` — 보물찾기 관련 데이터 관리
    - Context + 네비게이션 파라미터로 화면 간 상태 동기화

  - #### **Build & Development**
    - Metro Bundler
    - 플랫폼별 네이티브 빌드 (Xcode / Android Studio)
    - `.env` 또는 설정 파일을 통한 API 서버 주소 관리
    - 개발 환경 분리(dev / prod) 및 GitHub Actions를 통한 프론트엔드 CI/CD 구성

## Case Study

- ### 문제 정의

  - **계획 단계의 과부하**: 이용자는 정보를 많이 모으지만, 현장에서 쓰려면 다시 일정을 짜야 한다. 이 **추가 계획 비용** 때문에 실행 시작률이 떨어진다.
  - **행동 단위의 부재**: 코스가 장소 목록에 머물러 “지금 여기서 뭘 할지”가 비어 있다. 순서·조건·대안이 없어 **현장 의사결정 피로**가 크다.
  - **앱 전환 마찰**: 검색, 후기, 지도, 체크리스트를 오가며 **맥락이 끊기고** 집중력이 떨어진다.
  - **재방문 동기 부족**: 한 번 소비하면 끝나는 코스는 **리플레이어빌리티**가 낮아 복귀 이유가 약하다.

- ### 해결 접근

  - **콘텐츠 단위 전환**: 장소 리스트가 아닌 **퀘스트/보물찾기**를 기본 단위로 채택한다.
    - 퀘스트: **난이도/도전**이 있는 단계형 미션(스텝·힌트·완료 조건).
    - 보물찾기: **현장 즉시 생성** 가능한 가벼운 1회성 위치 미션.
  - **계획 단계 제거 → 바로 실행**: 사용자는 **퀘스트를 받아(수신) → 단계별 안내를 따라 → 완료**한다. 별도의 일정 재작성 없이 **“받고-바로 수행”** 흐름을 만든다.
  - **앱 내부 순환 공유**: 프로필/팔로우/피드백을 통해 퀘스트가 **앱 내에서 발견→실행→피드백** 루프를 돈다.
  - **재방문 동기 설계**: 퍼즐/수집 요소로 **동일 지역도 다른 루트**를 제공한다.

- ### 사용자 시나리오

  **A. 수행자 시나리오**

  1. **탐색**: 앱에서 관심 지역의 퀘스트/보물찾기를 발견한다.
  2. **수신**: 맘에 드는 퀘스트를 받아 저장한다(별도 일정 작성 없음).
  3. **실행**: 현장에서 **단계별 안내**를 따라 진행한다.
  4. **완료/공유**: 완료를 기록하고(보상 수집 포함), 좋아요/댓글로 피드백을 남긴다.

  **B. 제작자(창작자) 시나리오**

  **B-1. 퀘스트(난이도/도전 중심) 제작**

  1. **기획**: 지역·테마 선택 → **목표/난이도/제한조건** 정의(예: 시간제한, 순서 고정, 분기 조건).
  2. **제작**: 퀘스트 단위로 **러닝 로케이션(sequence) → 스텝(Action)** 구성
     - Action 예시: 대화(Talking), 이동(Walking), 체류(Staying), 퍼즐(Photo/Location/Input)
  3. **미리보기/보정**: 흐름 점검, **힌트/실패/완료 조건** 다듬기.
  4. **발행**: 프로필에 게시, 팔로워/피드/검색 노출.
  5. **순환**: 반응 좋은 퀘스트는 재노출·공유로 확산, 제작자는 **신뢰/팔로워** 축적.

  **B-2. 보물찾기(탐험/가벼운 참여 중심) 제작**

  1. **현장 이동**
     - 제작자가 **직접 해당 위치에 도착**한다.
  2. **보물 숨기기 시작**
     - 앱에서 **보물 숨기기(Create Treasure)** 기능 실행.
     - 앱이 **현재 GPS 좌표를 자동 캡처**한다.
  3. **기본 정보 입력**
     - **제목 한 줄** 입력.
     - **짧은 단서 한 줄** 혹은 **설명** 입력.
  4. **등록**
     - **등록** 버튼을 누르면, 보물은 해당 좌표에 **즉시 활성화**되며 앱내부에 활성화 된다.
  5. **종료 및 관리**
     - **다른 사용자가 먼저 찾는 순간, 해당 보물은 즉시 종료(비활성화)** 된다.

## Conclusion

TaBi의 핵심은 **계획을 없애 실행을 만들었다**는 데 있다. 여행 정보의 “읽기-저장-정리”라는 복잡한 절차를 **“받고-바로 수행”**으로 치환함으로써 시작 지연과 이탈을 줄였으며, 코스를 목록이 아닌 **행동 단위(스텝·힌트·완료 조건)**로 제공해 사용자는 계획 재작성 없이 곧바로 실행 가능케 했다. 또한 동일 지역이라도 **미션화**를 통해 구성과 목표가 달라지므로, 단발성 소비가 아닌 **재방문 동기**가 생긴다. 마지막으로 퀘스트가 **앱 내부에서 공유·피드백·재발견**되는 루프를 형성하여, 각각의 개인 블로그에 고립된 코스보다 **신선한 콘텐츠가 더 빠르게 회전**한다. 요약하면, TaBi는 여행을 정보 소비가 아닌 **즉시 실행 가능한 경험**으로 재정의하고, 그 경험이 **반복·확산**되도록 구조화한 서비스를 개발하였다.
