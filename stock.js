const apiKey = '8d6365d468924d048dfa7c6b154a1f63'; /** Twelve API 키 */
const stockSymbols = ['AAPL', 'MSFT', 'TSLA', '005930.KS', '000660.KS', '051910.KS']; /** 종목 리스트 */
let currentIndex = 0; /** 현재 종목 인덱스 */
let chartInstance; /** 차트 인스턴스를 저장할 변수 */

/** 주식 데이터 가져오기 */
async function fetchStockData(symbol) {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1); // 1년 전 날짜 설정
    
    const startDate = oneYearAgo.toISOString().split('T')[0]; /** 1년 전 날짜 */
    const endDate = today.toISOString().split('T')[0]; /** 오늘 날짜 */

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('주식 데이터를 가져오는 데 실패했습니다.');

        const data = await response.json();
        console.log(data); /** 데이터 확인을 위해 콘솔에 출력 */

        if (data && data.values) {
            const chartData = processStockData(data.values); // 주식 데이터를 차트 형식으로 변환
            renderChart(chartData, symbol); /** 차트 렌더링 */

            /** 최신 데이터로 주식 정보 업데이트 */
            const latestData = data.values[data.values.length - 1];
            updateStockInfo({
                name: symbol, /** 주식 이름을 심볼로 설정 */
                price: latestData.close,
                change: ((latestData.close - latestData.open) >= 0 ? '+' : '-') + 
                         Math.abs((latestData.close - latestData.open).toFixed(2)) + 
                         ` (${(((latestData.close - latestData.open) / latestData.open) * 100).toFixed(2)}%)`,
                open: latestData.open,
                prevClose: latestData.close,
                volume: latestData.volume,
                marketCap: calculateMarketCap(latestData.close, latestData.volume), /** 계산된 시가총액 */
                dayRange: `${latestData.low} - ${latestData.high}`,
                weekRange: '53.15 - 137.98', /** 예시로 설정 */
            });
        } else {
            throw new Error('주식 데이터가 없습니다.');
        }
    } catch (error) {
        console.error(error.message); /** 오류 메시지 출력 */
    }
}

/** 시가총액 계산 함수 */
function calculateMarketCap(price, volume) {
    const marketCapValue = price * volume; /** 가격 × 거래량 */
    return `${(marketCapValue / 1e12).toFixed(3)}T`; /** 조 단위로 변환하여 반환 */
}

/** API에서 받은 데이터를 날짜와 가격으로 처리 */
function processStockData(stockValues) {
    const labels = stockValues.map(item => item.datetime).reverse(); /** 날짜 */
    const prices = stockValues.map(item => parseFloat(item.close)).reverse(); /** 종가 */

    return { labels, prices }; // 차트에 사용할 데이터 반환
}

/** 차트를 렌더링하는 함수 */
function renderChart({ labels, prices }, stockSymbol) {
    const ctx = document.getElementById('stockChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy(); /** 이전 차트 삭제 */
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${stockSymbol} 종가 (USD)`,
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
            }]
        },
        options: {
            responsive: true, /** 반응형 설정 */
            maintainAspectRatio: true, /** 비율 유지 */
            plugins: {
                title: {
                    display: true,
                    text: `${stockSymbol} 주식 차트`,
                    font: {
                        size: 16,
                    },
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month' /** 월 단위로 표시 */
                    },
                },
                y: {
                    beginAtZero: false /** Y축을 0부터 시작하지 않도록 설정 */
                }
            }
        }
    });
}

/** 주식 정보를 업데이트하는 함수 */
function updateStockInfo(stockData) {
    document.getElementById('stock-name').innerText = stockData.name; /** 주식 이름 업데이트 */
    document.getElementById('stock-price').innerText = `${stockData.price} USD`; /** 주식 가격 업데이트 */
    document.getElementById('stock-change').innerText = stockData.change; /** 주식 변화 업데이트 */

    /** 통계 업데이트 */
    document.getElementById('open-price').innerText = stockData.open; /** Open 가격 업데이트 */
    document.getElementById('prev-close').innerText = stockData.prevClose; /** Prev Close 가격 업데이트 */
    document.getElementById('volume').innerText = stockData.volume; /** 거래량 업데이트 */
    document.getElementById('market-cap').innerText = stockData.marketCap; /** 시가총액 업데이트 */
    document.getElementById('day-range').innerText = stockData.dayRange; /** 일일 범위 업데이트 */
    document.getElementById('52-week-range').innerText = stockData.weekRange; /** 52주 범위 업데이트 */
}

/** 차트를 드래그하여 이전/다음 종목으로 이동 */
function handleChartDrag(event) {
    if (event.deltaX < 0) {
        currentIndex = (currentIndex + 1) % stockSymbols.length; /** 인덱스 증가 */
    } else {
        currentIndex = (currentIndex - 1 + stockSymbols.length) % stockSymbols.length; /** 인덱스 감소 */
    }

    fetchStockData(stockSymbols[currentIndex]); /** 새 종목 데이터 요청 */
}

/** 차트에 이벤트 리스너 추가 */
document.getElementById('stockChart').addEventListener('mousedown', (event) => {
    let startX = event.clientX; /** 드래그 시작 위치 */

    const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX; /** 이동한 거리 */
        if (Math.abs(deltaX) > 50) { /** 드래그 감지 */
            handleChartDrag({ deltaX }); /** 드래그 핸들러 호출 */
            startX = moveEvent.clientX; /** 드래그 시작 위치 업데이트 */
        }
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove); /** 이벤트 리스너 제거 */
        document.removeEventListener('mouseup', onMouseUp); /** 이벤트 리스너 제거 */
    };

    document.addEventListener('mousemove', onMouseMove); /** 드래그 중 위치 업데이트 */
    document.addEventListener('mouseup', onMouseUp); /** 드래그 종료 시 이벤트 리스너 제거 */
});

/** 페이지가 로드될 때 첫 번째 주식 데이터 요청 */
fetchStockData(stockSymbols[currentIndex]);
