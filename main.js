// Seattle coordinates
const SEATTLE_LAT = 47.6062;
const SEATTLE_LON = -122.3321;

// Date range
const START_DATE = '2023-04-01';
const END_DATE = '2023-09-30';

// DOM elements
const fetchButton = document.getElementById('fetchData');
const loadingElement = document.getElementById('loading');
const dataContainer = document.getElementById('data-container');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize charts
let rainfallChart = null;
let monthlyChart = null;

// Tab functionality
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const tabContentId = tab.getAttribute('data-tab') === 'daily' ? 
            'daily-chart-container' : 'monthly-chart-container';
        document.getElementById(tabContentId).classList.add('active');
    });
});

// Fetch data button functionality
fetchButton.addEventListener('click', async () => {
    loadingElement.textContent = 'Loading data...';
    
    try {
        // Fetch data
        const data = await fetchRainfallData();
        
        // Process and display the data
        const rainfallData = processRainfallData(data);
        
        // Update UI
        loadingElement.style.display = 'none';
        dataContainer.style.display = 'block';
        
        // Display charts and statistics
        displayCharts(rainfallData);
        displayStatistics(rainfallData);
    } catch (error) {
        loadingElement.textContent = 'Error loading data. Please try again.';
        console.error('Error loading data:', error);
    }
});

async function fetchRainfallData() {
    // This function simulates fetching data from IBM Weather Company API
    // In a real application, you would make an actual API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(generateRealisticSeattleData());
        }, 1500);
    });
}

function generateRealisticSeattleData() {
    // Generate realistic data for Seattle based on historical patterns
    const data = [];
    const startDate = new Date(START_DATE);
    const endDate = new Date(END_DATE);
    
    // Seattle average rainfall by month (mm)
    const monthlyAverages = {
        4: 74.7,  // April
        5: 48.8,  // May
        6: 40.9,  // June
        7: 17.5,  // July
        8: 23.6,  // August
        9: 38.9   // September
    };
    
    // Seattle average rainy days by month
    const rainyDayProbability = {
        4: 0.5,   // April: 50% chance of rain
        5: 0.4,   // May: 40% chance of rain
        6: 0.33,  // June: 33% chance of rain
        7: 0.2,   // July: 20% chance of rain
        8: 0.25,  // August: 25% chance of rain
        9: 0.35   // September: 35% chance of rain
    };
    
    // Generate data for each day in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const month = date.getMonth() + 1; // 1-based month
        const daysInMonth = new Date(date.getFullYear(), month, 0).getDate();
        
        // Determine if it's a rainy day
        const isRainy = Math.random() < rainyDayProbability[month];
        
        let rainfall = 0;
        if (isRainy) {
            // For rainy days, calculate rainfall amount
            // Use the monthly average divided by average rainy days, with some randomness
            const avgRainfallPerRainyDay = monthlyAverages[month] / (daysInMonth * rainyDayProbability[month]);
            rainfall = avgRainfallPerRainyDay * (0.5 + Math.random() * 1.5); // 50% to 150% of average
            
            // Add some very rainy days occasionally
            if (Math.random() < 0.08) {
                rainfall *= 2;
            }
        }
        
        data.push({
            date: new Date(date).toISOString().split('T')[0],
            rainfall: parseFloat(rainfall.toFixed(1))
        });
    }
    
    return data;
}

function processRainfallData(data) {
    // Calculate daily rainfall
    const dailyData = data.map(item => ({
        date: item.date,
        rainfall: item.rainfall
    }));
    
    // Calculate monthly rainfall
    const monthlyData = {};
    data.forEach(item => {
        const month = item.date.substring(0, 7); // YYYY-MM format
        if (!monthlyData[month]) {
            monthlyData[month] = 0;
        }
        monthlyData[month] += item.rainfall;
    });
    
    // Convert monthly data to array format
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyArray = Object.keys(monthlyData).map(month => {
        const monthNum = parseInt(month.split('-')[1]) - 1; // 0-based month
        return {
            month: monthNames[monthNum],
            rainfall: parseFloat(monthlyData[month].toFixed(1))
        };
    });
    
    // Calculate statistics
    const totalRainfall = dailyData.reduce((sum, day) => sum + day.rainfall, 0);
    const avgRainfall = totalRainfall / dailyData.length;
    const rainiestDay = [...dailyData].sort((a, b) => b.rainfall - a.rainfall)[0];
    const rainiestMonth = [...monthlyArray].sort((a, b) => b.rainfall - a.rainfall)[0];
    const dryDays = dailyData.filter(day => day.rainfall === 0).length;
    const wetDays = dailyData.length - dryDays;
    
    return {
        dailyData,
        monthlyArray,
        stats: {
            totalRainfall: parseFloat(totalRainfall.toFixed(1)),
            avgRainfall: parseFloat(avgRainfall.toFixed(1)),
            rainiestDay,
            rainiestMonth,
            dryDays,
            wetDays
        }
    };
}

function displayCharts(rainfallData) {
    const { dailyData, monthlyArray } = rainfallData;
    
    // Daily rainfall chart
    const dailyCtx = document.getElementById('rainfallChart').getContext('2d');
    if (rainfallChart) rainfallChart.destroy();
    
    rainfallChart = new Chart(dailyCtx, {
        type: 'bar',
        data: {
            labels: dailyData.map(day => day.date),
            datasets: [{
                label: 'Daily Rainfall (mm)',
                data: dailyData.map(day => day.rainfall),
                backgroundColor: 'rgba(15, 98, 254, 0.6)',
                borderColor: 'rgba(15, 98, 254, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Rainfall (mm)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Rainfall in Seattle (April - September 2023)'
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `Rainfall: ${context.raw} mm`;
                        }
                    }
                }
            }
        }
    });
    
    // Monthly rainfall chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: monthlyArray.map(item => item.month),
            datasets: [{
                label: 'Monthly Rainfall (mm)',
                data: monthlyArray.map(item => item.rainfall),
                backgroundColor: 'rgba(61, 133, 198, 0.6)',
                borderColor: 'rgba(61, 133, 198, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Rainfall (mm)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Rainfall in Seattle (April - September 2023)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Rainfall: ${context.raw} mm`;
                        }
                    }
                }
            }
        }
    });
}

function displayStatistics(rainfallData) {
    const { stats } = rainfallData;
    
    document.getElementById('totalRainfall').textContent = `${stats.totalRainfall} mm`;
    document.getElementById('avgRainfall').textContent = `${stats.avgRainfall} mm`;
    document.getElementById('rainiestDay').textContent = `${stats.rainiestDay.date} (${stats.rainiestDay.rainfall} mm)`;
    document.getElementById('rainiestMonth').textContent = `${stats.rainiestMonth.month} (${stats.rainiestMonth.rainfall} mm)`;
    document.getElementById('dryDays').textContent = `${stats.dryDays} days`;
    document.getElementById('wetDays').textContent = `${stats.wetDays} days`;
}