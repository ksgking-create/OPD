# OPD KIPRIS Web App - GitHub + Netlify

사용자는 설치 없이 Netlify 웹주소에 접속하여 본인의 KIPRIS Plus API Key와 출원번호만 입력합니다.

## 사용자

1. `https://사이트이름.netlify.app` 접속
2. KIPRIS Plus API Key 입력
3. 출원번호 입력 후 현황 조회

Netlify 또는 GitHub 가입, 파일 실행, 프로그램 설치, 브라우저 확장프로그램·CORS·프록시·보안 설정 변경이 필요하지 않습니다.

API Key는 서버·DB·로그에 저장하지 않으며 현재 브라우저 탭에서만 유지합니다. 탭을 닫으면 다시 입력합니다.

## 관리자 최초 배포

1. 이 폴더의 파일을 GitHub 저장소 루트에 올립니다.
2. Netlify에서 `Add new project` → `Import an existing project` → `GitHub`를 선택합니다.
3. 해당 저장소를 선택합니다.
4. Build command는 비워 두고, Publish directory는 `public`인지 확인합니다.
5. `Publish`를 선택합니다.

Netlify는 `netlify.toml`과 `netlify/functions/app.mjs`를 자동 인식하므로 환경변수, API Key, 별도 서버 설정이 필요하지 않습니다. 이후 GitHub에 변경사항을 반영하면 Netlify가 자동 재배포합니다.

## 무료 사용

- Netlify 계정은 배포 관리자 한 명만 필요합니다.
- 일반 사용자는 Netlify/GitHub 계정이 필요하지 않습니다.
- Netlify 무료 플랜의 월간 한도 내에서 사용할 수 있습니다.
- 각 사용자는 본인 KIPRIS Plus API Key의 상품 권한과 호출 한도를 사용합니다.

## 보안

- KIPRIS Plus 목적지와 API 경로 고정
- Key와 출원번호 형식 검증
- 응답 12초 제한, API별 최대 2MB
- 위험한 XML 선언 차단
- CSP 및 클릭재킹·MIME 스니핑 방지
- 조회번호, API Key, 응답본문을 코드에서 로깅하지 않음
