var maskInfoClass = function (opts) {

    this._options = $.extend({
        lat: 37.4997283,
        lng: 127.0287867,
        api_url: "https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByGeo/json?lat=",
        loading_div_name : '#loadingDiv',
        btn_cur_location_name :'#cur_location_btn',
        btn_refresh_name :'#refresh_btn',
        map_id:"map",
        search_range: 1000,
        bottom_margin: 150,
        minRefreshLat : 0.001,
        minRefreshLng : 0.007
    }, opts);

    this._mapInitOptions = {
        center: new naver.maps.LatLng(this._options.lat, this._options.lng),
        zoom: 15
    };

    this._stock_desc = {
        plenty: "100개 이상",
        some: "30개 이상",
        few: "30개 미만",
        empty: "없음"
    };

    this._marker_zindex = {
        plenty: 100,
        some: 30,
        few: 10,
        empty: 0
    };

    this._map;

    this._markers = [];
    this._infoWindows = [];
    this._curInfoWindow = null;
    this._curLat = this._options.lat;
    this._curLng = this._options.lng;
    this._loadingDiv = null;

};

maskInfoClass.prototype = {
    constructor: maskInfoClass,

    init : function() {

        this._loadingDiv= $(this._options.loading_div_name);
        this._loadingDiv.hide();

        this._map = new naver.maps.Map(this._options.map_id, this._mapInitOptions);

        naver.maps.Event.addListener(this._map, 'dragend', function(e) {

            var coords=this._map.getCenter();

            if (Math.abs(this._curLat - coords.lat()) <  this._options.minRefreshLat && Math.abs(this._curLng - coords.lng()) < this._options.minRefreshLng) {
                return;
            }

            this._invokeAPI(coords.lat(), coords.lng() );

            this._clearCurInfo();

        }.bind(this));

        naver.maps.Event.addListener(this._map, 'click', function(e) {
             this._clearCurInfo();
        }.bind(this));

        this._getLocation();


        $(this._options.btn_cur_location_name).click(function(){
            this._getLocation();

        }.bind(this));

        $(this._options.btn_refresh_name).click(function(){
            this._getCenterInfo();
        }.bind(this));

        $(window).resize(function() {
            this._setMapSize();
        }.bind(this));

        this._setMapSize();

    },

    _setMapSize: function () {
        w = $(window).width();
        h = $(window).height() - this._options.bottom_margin;
        this._map.setSize(new naver.maps.Size(w, h));
    },

    _getLocation: function () {
        if (navigator.geolocation) {
            this._loadingDiv.show();
            navigator.geolocation.getCurrentPosition(this._onSuccessGeolocation.bind(this), this._onErrorGeolocation.bind(this));
        } else {
            var center = this._map.getCenter();

            var infoWindow = new naver.maps.InfoWindow({
                content: '<div style="padding:20px;"><h5 style="margin-bottom:5px;color:#f00;">위치 정보를 가져올 수 없습니다.</h5></div>'
            });

            infowindow.open(this._map, center);
        }

    },

    _getCenterInfo: function () {

        var coords = this._map.getCenter();
        this._invokeAPI(coords.lat(), coords.lng());

    },

    _onSuccessGeolocation: function (position) {

        var location = new naver.maps.LatLng(position.coords.latitude,
            position.coords.longitude);
        this._map.setCenter(location); // 얻은 좌표를 지도의 중심으로 설정합니다.
        //console.log('Coordinates: ' + location.toString());
        this._loadingDiv.hide();
        this._invokeAPI(position.coords.latitude, position.coords.longitude);


    },

    _onErrorGeolocation: function () {
        var center = this._map.getCenter();
        this._loadingDiv.hide();

    },

    _invokeAPI: function (lat, lng) {

        var m = this._options.search_range;
        var url = this._options.api_url + lat + "&lng=" + lng + "&m=" + m;

        //console.log("lat" + lat + ",lng" +lng);

        this._curLat = lat;
        this._curLng = lng;

        this._loadingDiv.show();

        $.ajax({
            url: url,
            method: "GET",
            success: this._onSuccessAPI.bind(this),
            error: function (xhr, status, err) {
                alert('error:' + err.toString());
                this._loadingDiv.hide();
            }.bind(this)
        });

    },


    // 해당 마커의 인덱스를 seq라는 클로저 변수로 저장하는 이벤트 핸들러를 반환합니다.
    _getClickHandler: function (seq, req) {
        return function (e) {

            req.hide();

            var marker = this._markers[seq],
                infoWindow = this._infoWindows[seq];

            if (infoWindow.getMap()) {
                infoWindow.close();
                this._curInfoWindow = null;
            } else {
                infoWindow.open(this._map, marker);
                this._curInfoWindow = infoWindow;
            }

        }.bind(this)
    },

    /*
     *
     */
    _onSuccessAPI: function (data) {

        var jsonResult = data;
        //console.log(data);
        //console.log(data.count);

        var today = getDateStr(0);
        var yesterday = getDateStr(-1);

        var recognizer = new MarkerOverlappingRecognizer({
            highlightRect: false,
            tolerance: 5
        });
        recognizer.setMap(this._map);
        recognizer.setClearCurInfo(this._clearCurInfo.bind(this));

        this._loadingDiv.hide();

        for (var j = 0; j < this._markers.length; j++) {
            if (this._markers[j] != undefined) this._markers[j].setMap(null);
        }

        for (var i = 0; i < data.count; i++) {

            var item = data.stores[i];

            if (item.remain_stat == null) {
                item.remain_stat = 'empty'
            } else if (item.remain_stat == "break") {
                continue;
            }
            if (item.stock_at == null) {
                item.stock_at = '없음';
            } else if (item.stock_at.length == 19) {
                item.stock_at = item.stock_at.substring(5, 16);
                item.stock_at = item.stock_at.replace(today,'오늘').replace(yesterday,'어제');
            }

            var icon_path = './images/' + item.type + '_' + item.remain_stat + '.png';
            var stoc_desc = this._stock_desc[item.remain_stat];

            if (item.type == "01" && item.stock_at.startsWith('어제') && item.remain_stat == "empty") {
                icon_path = './images/' + item.type + '_' + item.remain_stat + '_2.png';
                stoc_desc = '없음(입고예정)';
            }

            var m_size = null;

            if (item.type == '01') {
                m_size = new naver.maps.Size(25, 34);
            } else if  (item.type == '02'){
                m_size = new naver.maps.Size(30, 30);
            } else if  (item.type == '03'){
                m_size = new naver.maps.Size(30, 30);
            } else {
                continue;
            }


            this._markers[i] = new naver.maps.Marker({
                position: new naver.maps.LatLng(item.lat, item.lng),
                map: this._map,
                title: item.name,
                icon: {
                    url: icon_path ,
                    size: m_size,
                    scaledSize: m_size,
                    origin: new naver.maps.Point(0, 0),
                    anchor: new naver.maps.Point(11, 35)
                },
                zIndex: this._marker_zindex[item.remain_stat]
            });

            recognizer.add(this._markers[i]);

            var contentString = [
                        '<div class="shop_info">',
                        '   <div class="tit">' + item.name + '</div>',
                        '   ▪️ ' + item.addr.trim() + '<br>',
                        '   ▪️ 재고 수량: ' + stoc_desc + '<br>',
                        '   ▪️ 직전입고시간: ' + item.stock_at.trim() + '<br>',
                        '</div>'
                        ].join('');

            this._infoWindows[i] = new naver.maps.InfoWindow({
                content: contentString
            });

            naver.maps.Event.addListener(this._markers[i], 'click', this._getClickHandler(i, recognizer));

        }

    },

    _clearCurInfo: function () {
        if (this._curInfoWindow != null) {
            this._curInfoWindow.close();
            this._curInfoWindow = null;
        }
    }
};
