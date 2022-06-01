function imageClick(url) {
    window.location = url;
}

function addMarker(map, id, lat, lng, title, description, image, stars, reviews) {
    const marker = new google.maps.Marker({
        position: {
            lat: lat,
            lng: lng
        },
        map: map,
        title: title,
        icon: {
            url: "img/parking-pin.png",
            size: new google.maps.Size(50, 69),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(33, 46),
        }
    });

    //add info window to the marker
    let contentString = `<div class="card d-flex flex-column justify-content-center" style="">
                            <img src="${image}" class="card-img-top rounded mx-auto" style="cursor:pointer;width:100px" alt="..." onclick='imageClick("detailParking?id=${id}")'>
                            <div class="card-body">
                            <h5 class="card-title">${title}</h5>
                            <p class="card-text">${description}</p>`
    if (stars != null) {
        contentString += `<p>${stars}&nbsp;<i class="fa-solid fa-star mr-2" style="color: #ffc107"></i>&nbsp;(${reviews})</p>`
    }
    contentString += `<a href="detailParking?id=${id}" class="btn btn-primary">Vai ai dettagli</a>
                        </div>
                        </div>`;

    const infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
        // close the info window if the user clicks on the map
        google.maps.event.addListener(map, 'click', function () {
            infowindow.close();
        });
    });
}
let map, infoWindow

// Initialize and add the map
async function initMap() {

    const vietnam = { lat: 46.06900002992592, lng: 11.149703082567576 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: vietnam,
        mapId: "cdf6eba00718c578"
    });

    infoWindow = new google.maps.InfoWindow();

    const locationButton = document.createElement("button");

    locationButton.textContent = "Mostra la tua posizione";
    locationButton.classList.add("custom-map-control-button");
    locationButton.classList.add("btn");
    locationButton.classList.add("btn-sm");
    locationButton.classList.add("btn-primary");
    locationButton.classList.add("mb-2");
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(locationButton);
    locationButton.addEventListener("click", () => {
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    new google.maps.Marker({
                        map,
                        title: "Sei qui!",
                        position: pos,
                    })
                    map.setCenter(pos);
                    map.setZoom(15);
                },
                () => {
                    handleLocationError(true, infoWindow, map.getCenter());
                }
            );
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }
    });

    const icon = {
        url: "img/parking-pin.png",
        size: new google.maps.Size(50, 69),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(33, 46),
    };

    const contentString =
        '<div id="content">' +
        '<div id="siteNotice">' +
        "</div>" +
        '<h1 id="firstHeading" class="firstHeading">Vietnam</h1>' +
        '<div id="bodyContent">' +
        "<p>Il <b>Vietnam</b> di Trento è il parcheggio più bello del mondo e per questo non è prenotabile.<br>Prova con uno dei tanti parcheggi di Parket!</p>" +
        `<p>100&nbsp;<i class="fa-solid fa-star mr-2" style="color: #ffc107"></i>&nbsp;(1000000)</p>` +
        "</div>" +
        "</div>";

    const infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    const marker = new google.maps.Marker({
        position: vietnam,
        map: map,
        icon: icon,
        title: "Vietnam (TN)",
        animation: google.maps.Animation.BOUNCE,
    });
    setTimeout(function () {
        marker.setAnimation(null);
    }, 10000)
    marker.addListener("click", () => {
        infowindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
        });
    });
    // close the info window if the user clicks on the map
    google.maps.event.addListener(map, 'click', function () {
        infowindow.close();
    });

    // get every parking in the database
    const res = await fetch("/api/v1/parkings", {
        method: "GET",
    })
    data = await res.json()
    console.log(data)
    data.forEach(parking => {
        addMarker(map, parking._id, parking.latitude, parking.longitude, parking.name, parking.description, parking.image, parking.averageStars, parking.reviews.length)
    });

    initAutocomplete(map)
}

// Initialize the autocomplete feature
function initAutocomplete(map) {

    // create the search box and link it to the UI element
    const searchBar = document.getElementById("searchTextField")
    const searchBox = new google.maps.places.SearchBox(searchBar);

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchBar);

    let markers = [];

    // listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // clear out the old markers
        markers.forEach((marker) => {
            marker.setMap(null);
        });
        markers = [];

        // for each place, get the icon, name and location
        const bounds = new google.maps.LatLngBounds();

        places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry");
                return;
            }

            const icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25),
            };

            // create a marker for each place
            markers.push(
                new google.maps.Marker({
                    map,
                    icon,
                    title: place.name,
                    position: place.geometry.location,
                })
            );

            if (place.geometry.viewport) {
                // only geocodes have viewport
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
        browserHasGeolocation
            ? "Error: The Geolocation service failed."
            : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
}

window.initMap = initMap;
