function initMap() {
    const mapElement = document.getElementById('map');
    mapElement.style.height = '500px'; // 원하는 높이 설정
    mapElement.style.width = '100%'; // 너비를 100%로 설정

    map = new google.maps.Map(mapElement, {
        center: { lat: 37.5665, lng: 126.978 }, // 서울 위치
        zoom: 10 // 확대 수준
    });

    // 사용자의 현재 위치를 가져오는 부분
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // 마커 추가    
            new google.maps.Marker({
                position: userLocation,
                map: map,
                title: '내 위치'
            });

            // 현재 위치 날씨 정보 가져오기
            fetchWeatherByLocation();
            // 지도 중심을 사용자 위치로 설정
            map.setCenter(userLocation);
        }, () => {
            handleLocationError(true, map.getCenter());
        });
    } else {
        // 브라우저가 Geolocation을 지원하지 않는 경우
        handleLocationError(false, map.getCenter());
    }

    // SearchBox 초기화
    const input = document.getElementById('search-box');
    searchBox = new google.maps.places.SearchBox(input);

    // Search
    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();

        if (places.length === 0) {
            return;
        }

        // 마커 제거
        const marker = new google.maps.Marker({
            position: places[0].geometry.location,
            map: map,
            title: places[0].name
        });

        map.setCenter(places[0].geometry.location);
        map.setZoom(15); // 확대 수준 조정
    });
}

// 위치 오류 처리
function handleLocationError(browserHasGeolocation, pos) {
    const errorMessage = browserHasGeolocation
        ? '현재 위치를 가져오는 데 실패했습니다.'
        : '이 브라우저는 위치 정보를 지원하지 않습니다.';
    alert(errorMessage);
}

// 내 위치로 이동 버튼 클릭 시 실행되는 함수
document.getElementById('locateButton').addEventListener('click', () => {
    if (userLocation) {
        map.setCenter(userLocation);    
        map.setZoom(15); // 확대 수준 조정
    } else {
        alert('위치 정보를 가져오는 중입니다. 잠시 후 다시 시도해 주세요.');
    }
});

