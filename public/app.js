let exchangeChart = null;
let allData = [];

// API에서 데이터 가져오기
async function fetchExchangeRates() {
    try {
        const response = await fetch('/api/exchange-rates');
        const data = await response.json();
        allData = data;
        return data;
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        return [];
    }
}

// 차트 렌더링
function renderChart(data) {
    const ctx = document.getElementById('exchangeChart').getContext('2d');
    
    if (exchangeChart) {
        exchangeChart.destroy();
    }
    
    const labels = data.map(item => item.date);
    const rates = data.map(item => item.rate);
    
    exchangeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '환율 (원/달러)',
                data: rates,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '원 달러 환율 추이',
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return `날짜: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `환율: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: '날짜'
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '환율 (원)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// 시간 범위에 따라 데이터 필터링
function filterDataByPeriod(data, period) {
    if (period === 'max' || data.length === 0) {
        return data;
    }
    
    const lastDate = new Date(data[data.length - 1].date);
    let startDate;
    
    switch (period) {
        case '1year':
            startDate = new Date(lastDate);
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case '5years':
            startDate = new Date(lastDate);
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
        case '10years':
            startDate = new Date(lastDate);
            startDate.setFullYear(startDate.getFullYear() - 10);
            break;
        default:
            return data;
    }
    
    return data.filter(item => new Date(item.date) >= startDate);
}

// 시간 범위 선택기 이벤트 핸들러
function setupTimeRangeSelector() {
    const buttons = document.querySelectorAll('.range-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // 활성 버튼 스타일 변경
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 데이터 필터링 및 차트 업데이트
            const period = button.getAttribute('data-period');
            const filteredData = filterDataByPeriod(allData, period);
            renderChart(filteredData);
        });
    });
}

// 초기화
async function init() {
    const data = await fetchExchangeRates();
    renderChart(data);
    setupTimeRangeSelector();
}

// 페이지 로드 시 초기화 실행
document.addEventListener('DOMContentLoaded', init);
