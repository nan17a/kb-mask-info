# kb-mask-info
KB손해보험에서 만든 공공 마스크 알리미 소스를 공개합니다.
짧은 기간 만들어진 코드라 최적화 되지는 않았지만, 공익 목적 및 학습을 위한 샘플 코드로써 활용을 기대합니다.

## 사용API

* 건강보험심사평가원_공적 마스크 판매 정보 <https://www.data.go.kr/dataset/15043025/openapi.do>
* 네이버 MAP <https://navermaps.github.io/maps.js.ncp/>

## 사용방법

        var maskInfo = new maskInfoClass();

        $(window).on("load", function() {

            maskInfo.init({ loading_div_name : '#loadingDiv',
                            btn_cur_location_name :'#cur_location_btn',
                            btn_refresh_name :'#refresh_btn',
                            map_id:'map'
                          });

        });
        
* loading_div_name: 로딩중 표시용 div
* btn_cur_location_name: 현위치 검색용 버튼
* btn_refresh_name: 현재 지도에서 재검색용 버튼
* map_id: 네이버 맵이 그려질 div
   
   
## 관련 SITE

* KB손해보험 공공 마스크 알리미: <https://kb-mask-info.clayon.io>
* KB손해보험 홈페이지: <https://www.kbinsure.co.kr> 
* 개발자 블로그: <https://blog.naver.com/nan17a>       
        