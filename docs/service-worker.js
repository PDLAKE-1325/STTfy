/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

// Workbox를 사용하지 않는 기본 서비스 워커

// 앱 셸과 콘텐츠를 캐시할 이름을 지정합니다.
const CACHE_NAME = "stafy-cache-v1";

// 오프라인에서도 작동하기 위해 캐시할 파일 목록
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  "/static/js/0.chunk.js",
  "/static/js/bundle.js",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];

// 서비스 워커가 설치될 때 리소스를 캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("캐시 열기 성공");
      return cache.addAll(urlsToCache);
    })
  );
});

// 네트워크 요청을 가로채서 캐시된 응답이 있으면 제공
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에서 찾았으면 캐시된 값을 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크에서 가져옴
      return fetch(event.request)
        .then((response) => {
          // 유효한 응답인지 확인
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // 중요: 응답을 복제하여 캐시에 저장하고 브라우저에도 반환
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // 이미지, CSS, JS 파일만 캐시
            if (event.request.url.match(/\.(jpe?g|png|gif|svg|css|js)$/)) {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch(() => {
          // 네트워크 요청이 실패하면 오프라인 페이지 제공
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          // 기타 리소스는 null 반환 (오류 처리)
          return null;
        });
    })
  );
});

// 서비스 워커가 활성화될 때 이전 캐시 삭제
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 이전 버전의 캐시 삭제
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});
