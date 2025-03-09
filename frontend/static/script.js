document.addEventListener("DOMContentLoaded", function() {
    // Check if we're on the auth page
    if (!document.body.classList.contains("auth-page")) {
        return;
    }
    
    const loginContent = document.getElementById("loginContent");
    const signupContent = document.getElementById("signupContent");
    const tabButtons = document.querySelectorAll(".tab-btn");
    
    // Ensure only login is visible initially (adding a fail-safe)
    loginContent.style.display = "block";
    signupContent.style.display = "none";
    
    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Update active state on buttons
            tabButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            
            // Show the selected tab content
            const target = this.getAttribute("data-tab");
            if (target === "login") {
                loginContent.style.display = "block";
                signupContent.style.display = "none";
            } else {
                loginContent.style.display = "none";
                signupContent.style.display = "block";
            }
        });
    });
});



function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            document.getElementById("status").innerText = `Latitude: ${latitude}, Longitude: ${longitude}`;

            const platform = new H.service.Platform({
                apikey: "YOUR_HERE_MAPS_API_KEY" // Replace with your HERE Maps API Key
            });
            const defaultLayers = platform.createDefaultLayers();

            // Create a map centered at the user's location
            const map = new H.Map(
                document.getElementById("map"),
                defaultLayers.vector.normal.map,
                {
                    zoom: 14,
                    center: { lat: latitude, lng: longitude }
                }
            );

            // Enable map interaction
            const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
            const ui = H.ui.UI.createDefault(map, defaultLayers);

            // Add marker to the user's location
            const marker = new H.map.Marker({ lat: latitude, lng: longitude });
            map.addObject(marker);
        }, error => {
            document.getElementById("status").innerText = "Unable to retrieve location.";
            console.error(error);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

window.onload = getLocation;
