function imageClick(url) {
    window.location = url;
}

function addMarker(map, id, lat, lng, title, description, image) {
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
    const contentString = `<div id="content">
                                <div id="siteNotice">
                                </div>
                                <div id="bodyContent">
                                <h5>${title}</h5>
                                <p>${description}</p>
                                <img src="${image}" alt="parking-pin" width="150" height="150" class="rounded-circle" onclick='imageClick("detailParking?id=${id}")'></img>
                                </div>
                                </div>`;
    const infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });
}

// Initialize and add the map
async function initMap() {

    const vietnammo = { lat: 46.06900002992592, lng: 11.149703082567576 };
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: vietnammo,
        mapId: "cdf6eba00718c578"
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
        "</div>" +
        "</div>";
    const infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    const marker = new google.maps.Marker({
        position: vietnammo,
        icon: icon,
        map: map,
        title: "Vietnam (TN)",
    });
    marker.addListener("click", () => {
        infowindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
        });
    });


    //get every parking in the database
    const res = await fetch("/api/v1/parkings", {
        method: "GET",
    })
    data = await res.json()
    console.log(data)
    data.forEach(parking => {
        addMarker(map, parking._id, parking.latitude, parking.longitude, parking.name, parking.description, parking.image)
    });
    initAutocomplete(map)
}

function initAutocomplete(map) {

    // Create the search box and link it to the UI element.
    const searchBar = document.getElementById("searchTextField")
    const searchBox = new google.maps.places.SearchBox(searchBar);

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchBar);

    let markers = [];

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach((marker) => {
            marker.setMap(null);
        });
        markers = [];

        // For each place, get the icon, name and location.
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

            // Create a marker for each place.
            markers.push(
                new google.maps.Marker({
                    map,
                    icon,
                    title: place.name,
                    position: place.geometry.location,
                })
            );

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}

window.initMap = initMap;
