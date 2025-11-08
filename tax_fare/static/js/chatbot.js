let map = null;
let markers = [];
let routeLayer = null;

document.addEventListener('DOMContentLoaded', function() {
    initMap();
    showWelcomeMessage();
});

function initMap() {
    map = L.map('map').setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function showWelcomeMessage() {
    const welcomeMessage = `
       please select the Starting point and Destination point..`;
    
    addRichMessage(welcomeMessage, false);
}

function addRichMessage(html, isUser = false) {
    const chat = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    message.innerHTML = html;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
    
    setTimeout(() => {
        message.classList.add('message-animate');
    }, 10);
}

function addMessage(text, isUser = false) {
    addRichMessage(text, isUser);
}

function suggestPopularDestination(type) {
    let fromValue, toValue;
    
    // switch(type) {
    //     case 'airport':
    //         addMessage("I need a ride to the airport", true);
    //         fromValue = "Current Location";
    //         toValue = "International Airport";
    //         addRichMessage(`
    //             <div>Perfect! I can help you with an airport transfer.</div>
    //             <div class="info-box">
    //                 <p>🕒 Plan to arrive 2 hours before domestic flights</p>
    //                 <p>🕒 Plan to arrive 3 hours before international flights</p>
    //             </div>
    //         `);
    //         break;
            
    //     case 'downtown':
    //         addMessage("I want to go downtown", true);
    //         fromValue = "Current Location";
    //         toValue = "Downtown";
    //         addRichMessage(`
    //             <div>Downtown is always bustling with activity!</div>
    //             <div class="info-box">
    //                 <p>💡 Traffic tends to be busier during rush hours (8-9am, 5-6pm)</p>
    //             </div>
    //         `);
    //         break;
            
    //     case 'hotel':
    //         addMessage("I need a hotel pickup", true);
    //         fromValue = "Luxury Hotel";
    //         toValue = "City Center";
    //         addRichMessage(`
    //             <div>I'll help you arrange a hotel pickup.</div>
    //             <div class="info-box">
    //                 <p>🏨 Hotel pickups are usually at the main entrance</p>
    //                 <p>🕒 We recommend booking 15 minutes in advance</p>
    //             </div>
    //         `);
    //         break;
    // }
    
    document.getElementById('from').value = fromValue;
    document.getElementById('to').value = toValue;
    
    setTimeout(() => {
        addRichMessage(`
            <div>Please refine your pickup and destination addresses, then click "Estimate Fare".</div>
        `);
    }, 1000);
}

function showTypingIndicator() {
    const chat = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'message bot-message typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    indicator.id = 'typing-indicator';
    chat.appendChild(indicator);
    chat.scrollTop = chat.scrollHeight;
    return indicator;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function geocode(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        
        if (data.length === 0) {
            throw new Error(`Location not found: ${address}`);
        }
        
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            name: data[0].display_name
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw new Error(`Could not find location: ${address}`);
    }
}

async function getRoute(start, end) {
    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline`
        );
        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No route found');
        }
        
        return {
            distance: data.routes[0].distance / 1000,
            duration: Math.round(data.routes[0].duration / 60),
            geometry: data.routes[0].geometry
        };
    } catch (error) {
        console.error('Routing error:', error);
        throw new Error('Could not calculate route');
    }
}

function calculateFare(distance, transport) {
    const baseFare = {
        car: 5,
        bike: 3,
        bus: 7
    };
    
    const ratePerKm = {
        car: 2,
        bike: 1,
        bus: 7
    };
    
    const base = baseFare[transport];
    const distanceCost = distance * ratePerKm[transport];
    return {
        base,
        distance: distanceCost,
        total: base + distanceCost
    };
}

function updateMap(start, end, routeGeometry) {
    markers.forEach(marker => marker.remove());
    markers = [];
    if (routeLayer) routeLayer.remove();
    
    const startMarker = L.marker([start.lat, start.lng]).addTo(map);
    const endMarker = L.marker([end.lat, end.lng]).addTo(map);
    markers.push(startMarker, endMarker);
    
    const coordinates = polyline.decode(routeGeometry);
    const latLngs = coordinates.map(coord => [coord[0], coord[1]]);
    
    routeLayer = L.polyline(latLngs, {
        color: '#4F46E5',
        weight: 6,
        opacity: 0.8
    }).addTo(map);
    
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [50, 50] });
}

async function estimateFare() {
    const fromAddress = document.getElementById('from').value;
    const toAddress = document.getElementById('to').value;
    const transport = document.getElementById('transport').value;
    
    if (!fromAddress || !toAddress) {
        addRichMessage(`
            <div>❗ Please enter both starting point and destination.</div>
        `);
        return;
    }
    
    try {
        addRichMessage(`
            <div>I want to travel from <strong>${fromAddress}</strong> to <strong>${toAddress}</strong> by ${transport}</div>
        `, true);
        
        const indicator = showTypingIndicator();
        
        const start = await geocode(fromAddress);
        const end = await geocode(toAddress);
        
        const route = await getRoute(start, end);
        
        const fare = calculateFare(route.distance, transport);
        
        removeTypingIndicator();
        
        document.getElementById('map-wrapper').classList.add('active');
        map.invalidateSize();
        updateMap(start, end, route.geometry);
        
        document.getElementById('base-fare').textContent = `INR${fare.base.toFixed(2)}`;
        document.getElementById('distance-fare').textContent = `INR${fare.distance.toFixed(2)}`;
        document.getElementById('time-estimate').textContent = `${route.duration} mins`;
        document.getElementById('total-fare').textContent = `INR${fare.total.toFixed(2)}`;
        
        document.getElementById('booking-section').classList.add('active');
        
        addRichMessage(`
            <div class="route-found">
                <h3>🚗 Route Found!</h3>
                <div class="route-details">
                    <div class="route-detail">
                        <span class="detail-label">From:</span>
                        <span class="detail-value">${shortenAddress(start.name)}</span>
                    </div>
                    <div class="route-detail">
                        <span class="detail-label">To:</span>
                        <span class="detail-value">${shortenAddress(end.name)}</span>
                    </div>
                    <div class="route-detail">
                        <span class="detail-label">Distance:</span>
                        <span class="detail-value">${route.distance.toFixed(1)} km</span>
                    </div>
                    <div class="route-detail">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${route.duration} minutes</span>
                    </div>
                    <div class="route-detail highlight">
                        <span class="detail-label">Total Fare:</span>
                        <span class="detail-value">INR ${fare.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div class="suggestion-chips">
                <button onclick="bookRide()">Book Now</button>
                <button onclick="suggestAlternativeTransport('${transport}')">Other Options</button>
            </div>
        `);
        
    } catch (error) {
        removeTypingIndicator();
        addRichMessage(`
            <div class="error-message">
                <h3>❌ Error</h3>
                <p>${error.message}</p>
                <p>Please try with different locations.</p>
            </div>
        `);
    }
}

function suggestAlternativeTransport(currentTransport) {
    const alternatives = {
        car: { bike: "cheaper and eco-friendly", bus: "faster than car" },
        bike: { car: "faster and more comfortable", bus: "fater than bike" },
        bus: { car: "faster and more comfortable", bike: "faster while still eco-friendly" }
    };
    
    const options = alternatives[currentTransport];
    
    addRichMessage(`
        <div>
            <p>Here are some alternative transport options:</p>
            <ul class="transport-alternatives">
                ${Object.keys(options).map(mode => 
                    `<li>
                        <button onclick="switchTransport('${mode}')">Try ${mode}</button>
                        <span>${options[mode]}</span>
                    </li>`
                ).join('')}
            </ul>
        </div>
    `);
}

function switchTransport(mode) {
    document.getElementById('transport').value = mode;
    addMessage(`Let me try traveling by ${mode} instead`, true);
    estimateFare();
}

function shortenAddress(address) {
    const parts = address.split(',');
    return parts.slice(0, 2).join(',');
}