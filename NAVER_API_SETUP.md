# 네이버 API 설정 가이드

## 현재 상태
- Client ID: o59Ax6F6TgCwIfw35aHr
- Client Secret: 6PvYL48pHW
- 오류: 401 인증 실패

## 네이버 개발자 센터 확인 사항

### 1. 애플리케이션 등록 확인
- https://developers.naver.com/apps/ 접속
- 등록된 애플리케이션 상태 확인
- 서비스 상태가 "개발 중" 또는 "검수 완료"인지 확인

### 2. 검색 API 서비스 환경 설정
- 검색 API 서비스 사용 설정 확인
- 블로그 검색 API 권한 활성화
- 카페 검색 API 권한 활성화

### 3. 웹 서비스 URL 등록
- 서비스 URL: http://localhost:5000
- 또는 Replit URL 등록 필요

### 4. API 이용 권한 설정
- 검색 API 권한이 활성화되어 있는지 확인
- 일일 호출 한도 확인

## 해결 방법
1. 네이버 개발자 센터에서 애플리케이션 재등록
2. 검색 API 서비스 권한 활성화
3. 새로운 Client ID/Secret 발급
4. 환경변수 재설정

## 테스트 방법
```bash
curl -X GET "https://openapi.naver.com/v1/search/blog?query=테스트&display=1" \
  -H "X-Naver-Client-Id: YOUR_CLIENT_ID" \
  -H "X-Naver-Client-Secret: YOUR_CLIENT_SECRET"
```

## 중요 사항
- 가짜 데이터나 대체 데이터는 절대 사용하지 않음
- 실제 네이버 API 연동 필수
- 유효한 API 키 없이는 네이버 블로그/카페 수집 불가