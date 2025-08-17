// Function to initialize the application
function initializeApp() {
    // Initialize map preview
    initMapPreview();
    
    // Add location button functionality
    document.getElementById('addLocation').addEventListener('click', addLocationField);
    
    // Initialize location autocomplete for the first location field
    initLocationAutocomplete();
    
    // Remove location button delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-location')) {
            e.target.closest('.location-group').remove();
            updateMapPreview(); // Update preview when a location is removed
        }
    });

    // Form submission
    document.getElementById('mapForm').addEventListener('submit', function(e) {
        e.preventDefault();
        generateMap();
    });

    // Copy code button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'copyCode') {
            const code = document.getElementById('embedCode');
            navigator.clipboard.writeText(code.textContent).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 2000);
            });
        }
    });

    // Update map preview when the preview section becomes visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !previewMap) {
                initMapPreview();
            }
        });
    });
    
    const previewSection = document.querySelector('.preview-section');
    if (previewSection) {
        observer.observe(previewSection);
    }
    
    // Update preview when any input changes
    document.getElementById('mapForm').addEventListener('input', function(e) {
        // Only update preview if the input is not a clear button
        if (!e.target.classList.contains('clear-btn')) {
            updateMapPreview();
        }
    });

    // Add initial location field
    addLocationField();
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Function to add a new location field group
function addLocationField() {
    const locationsDiv = document.getElementById('locations');
    const locationGroup = document.createElement('div');
    locationGroup.className = 'location-group';
    locationGroup.innerHTML = `
        <div class="input-wrapper">
            <input type="text" class="location-input" name="locationName[]" placeholder="Location name" required>
            <button type="button" class="clear-btn" title="Clear field">×</button>
        </div>
        <div class="coords-wrapper">
            <div class="input-wrapper">
                <input type="number" name="lat[]" step="0.000001" placeholder="Latitude" required>
                <button type="button" class="clear-btn" title="Clear field">×</button>
            </div>
            <div class="input-wrapper">
                <input type="number" name="lng[]" step="0.000001" placeholder="Longitude" required>
                <button type="button" class="clear-btn" title="Clear field">×</button>
            </div>
        </div>
        <div class="input-wrapper">
            <input type="text" name="popupText[]" placeholder="Popup text (optional)">
            <button type="button" class="clear-btn" title="Clear field">×</button>
        </div>
        <button type="button" class="remove-location">Remove Location</button>
    `;
    
    locationsDiv.appendChild(locationGroup);
    
    // Initialize autocomplete for the new location input
    initLocationAutocomplete(locationGroup);
    
    // Add event listeners for clear buttons
    const clearButtons = locationGroup.querySelectorAll('.clear-btn');
    clearButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.previousElementSibling;
            if (input) {
                input.value = '';
                input.focus();
                
                // If this is a location name field, also clear lat/lng
                if (input.classList.contains('location-input')) {
                    const group = input.closest('.location-group');
                    if (group) {
                        group.querySelector('input[name="lat[]"]').value = '';
                        group.querySelector('input[name="lng[]"]').value = '';
                    }
                }
            }
        });
    });
    
    // Focus the new location input
    const input = locationGroup.querySelector('.location-input');
    if (input) input.focus();
    
    // Update preview when a new location is added
    updateMapPreview();
}

// Initialize location autocomplete
function initLocationAutocomplete(container = document) {
    const locationInputs = container.getElementsByClassName('location-input');
    
    for (let input of locationInputs) {
        // Only initialize if not already initialized
        if (input.dataset.autocompleteInitialized) continue;
        input.dataset.autocompleteInitialized = 'true';
        
        // Add event listener for when user stops typing (500ms debounce)
        let timeoutId;
        input.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            const query = e.target.value.trim();
            
            // Only search if query is long enough
            if (query.length < 3) return;
            
            timeoutId = setTimeout(() => {
                searchLocation(query, input);
            }, 500);
        });
    }
}

// Search for location using Nominatim API
async function searchLocation(query, inputElement) {
    // Show loading state
    inputElement.classList.add('loading', 'active');
    
    try {
        // Add a small delay to show loading state (min 500ms for better UX)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set a custom user agent as required by Nominatim's usage policy
        const headers = new Headers({
            'User-Agent': 'MapifyApp/1.0 (your-email@example.com)'
        });
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
            { headers }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const location = data[0];
            const locationGroup = inputElement.closest('.location-group');
            
            if (locationGroup) {
                const latInput = locationGroup.querySelector('input[name="lat[]"]');
                const lngInput = locationGroup.querySelector('input[name="lng[]"]');
                
                if (latInput && lngInput) {
                    latInput.value = parseFloat(location.lat).toFixed(6);
                    lngInput.value = parseFloat(location.lon).toFixed(6);
                    
                    // Try to get a more specific name (city, town, or village)
                    let displayName = location.display_name.split(',')[0];
                    if (location.address) {
                        displayName = location.address.city || 
                                    location.address.town || 
                                    location.address.village || 
                                    location.address.hamlet || 
                                    displayName;
                    }
                    
                    // Update the location name
                    inputElement.value = displayName;
                    
                    // Show success message
                    showMessage('Location found!', 'success');
                    return;
                }
            }
        }
        
        // If we got here, no location was found
        showMessage('Location not found. Please try a different name or enter coordinates manually.', 'error');
        
    } catch (error) {
        console.error('Error searching for location:', error);
        showMessage('Error searching for location. Please try again later.', 'error');
    } finally {
        // Always remove loading state
        inputElement.classList.remove('active', 'loading');
    }
}

// Map preview variables
let previewMap = null;
let previewMarkers = [];

function initMapPreview() {
    // Make sure the map container exists and is visible
    const mapContainer = document.getElementById('mapPreview');
    if (!mapContainer) {
        console.error('Map container not found');
        return false;
    }
    
    // Remove any existing map instance
    if (previewMap) {
        previewMap.remove();
        previewMap = null;
        previewMarkers = [];
    }
    
    // Make sure the container has dimensions
    mapContainer.style.display = 'block';
    mapContainer.style.height = '400px'; // Ensure height is set
    mapContainer.style.width = '100%';   // Ensure width is set
    
    // Add a small delay to ensure the container is properly rendered
    setTimeout(() => {
        try {
            // Initialize the map with some default view
            previewMap = L.map('mapPreview', {
                center: [0, 0],
                zoom: 2,
                zoomControl: false
            });

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(previewMap);

            // Add zoom control
            L.control.zoom({
                position: 'topright'
            }).addTo(previewMap);
            
            // Force a redraw
            previewMap.invalidateSize();
            
            // Update the map with any existing locations
            updateMapPreview();
            
        } catch (error) {
            console.error('Error initializing map:', error);
            return false;
        }
    }, 100);
    
    return true;
    L.control.zoom({
        position: 'topright'
    }).addTo(previewMap);

    // Update the map
    updateMapPreview();

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (previewMap) {
                previewMap.invalidateSize();
            }
        }, 250);
    });
}

// Update the map preview with current form data
function updateMapPreview() {
    if (!previewMap) {
        initMapPreview(); // Try to initialize the map if it doesn't exist
        if (!previewMap) return; // Still can't initialize, exit
    }
    
    // Clear existing markers
    previewMarkers.forEach(marker => {
        if (previewMap.hasLayer(marker)) {
            previewMap.removeLayer(marker);
        }
    });
    previewMarkers = [];
    
    // Get all location groups
    const locationGroups = document.querySelectorAll('.location-group');
    const bounds = [];
    
    locationGroups.forEach((group, index) => {
        try {
            const latInput = group.querySelector('input[name="lat[]"]');
            const lngInput = group.querySelector('input[name="lng[]"]');
            const nameInput = group.querySelector('.location-input');
            const popupText = group.querySelector('input[name="popupText[]"]');
            
            if (latInput?.value && lngInput?.value) {
                const lat = parseFloat(latInput.value);
                const lng = parseFloat(lngInput.value);
                
                if (isNaN(lat) || isNaN(lng)) return;
                
                const name = nameInput?.value || `Location ${index + 1}`;
                const popup = popupText?.value || name;
                
                // Create marker with popup
                const marker = L.marker([lat, lng], {
                    title: name,
                    alt: name,
                    riseOnHover: true
                }).addTo(previewMap)
                  .bindPopup(`<b>${name}</b><br>${popup}`);
                
                previewMarkers.push(marker);
                bounds.push([lat, lng]);
            }
        } catch (error) {
            console.error('Error processing location:', error);
        }
    });
    
    // Fit map to show all markers if we have any
    if (bounds.length > 0) {
        if (bounds.length === 1) {
            // If only one marker, center on it with default zoom
            previewMap.setView(bounds[0], 13);
        } else {
            // Fit bounds for multiple markers with padding
            previewMap.fitBounds(bounds, {
                padding: [30, 30],
                maxZoom: 15
            });
        }
    } else {
        // No valid locations, reset view
        previewMap.setView([0, 0], 2);
    }
    
    // Force a refresh of the map
    previewMap.invalidateSize();
}

// Show message to user
function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create and show new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Add the message before the form
    const form = document.querySelector('form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    } else {
        form.prepend(messageDiv);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.5s';
        setTimeout(() => messageDiv.remove(), 500);
    }, 5000);
}

// Function to generate the map
async function generateMap() {
    const form = document.getElementById('mapForm');
    const formData = new FormData(form);
    
    // Prepare locations array
    const locationNames = formData.getAll('locationName[]');
    const lats = formData.getAll('lat[]');
    const lngs = formData.getAll('lng[]');
    const popupTexts = formData.getAll('popupText[]');
    
    const locations = [];
    for (let i = 0; i < locationNames.length; i++) {
        if (lats[i] && lngs[i]) {
            locations.push({
                name: locationNames[i],
                lat: parseFloat(lats[i]),
                lng: parseFloat(lngs[i]),
                popupText: popupTexts[i] || ''
            });
        }
    }
    
    if (locations.length === 0) {
        alert('Please add at least one valid location');
        return;
    }
    
    // Prepare map config
    const mapConfig = {
        locations,
        width: formData.get('width') || '100%',
        height: formData.get('height') || '500',
        zoom: parseInt(formData.get('zoom')) || 12,
        scrollZoom: formData.get('scrollZoom') === 'on'
    };
    
    try {
        // Send to server
        const response = await fetch('/api/maps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mapConfig)
        });
        
        const result = await response.json();
        
        // Check if the response indicates success and has either success flag or mapId
        if ((result.success || result.mapId) && result.embedCode) {
            // Show result section
            document.getElementById('result').style.display = 'block';
            document.getElementById('embedCode').textContent = result.embedCode;
            
            // Update preview iframe
            const previewIframe = document.createElement('iframe');
            previewIframe.src = `/embed/${result.mapId || result.embedCode.match(/embed\/([^"']+)/)?.[1] || ''}`;
            previewIframe.width = '100%';
            previewIframe.height = '300';
            previewIframe.style.border = 'none';
            previewIframe.style.borderRadius = '4px';
            
            const previewContainer = document.getElementById('previewIframe');
            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewIframe);
            
            // Scroll to result
            document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
            
            // Show success message
            showMessage('Map generated successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to generate map');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate map. Please try again.');
    }
}
