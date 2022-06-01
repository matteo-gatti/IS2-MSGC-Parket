$(document).ready(getParkingData)

async function editParking() {
    // get the park id from the url
    let parkId = window.location.href.split("?")[1].split("=")[1]

    var name = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();

    console.log(name, address, desc, city, country)

    image = $("#image").prop("files")[0];

    const formData = new FormData();

    // create payload with image and json
    formData.append('image', image)
    formData.append('json', JSON.stringify({
        name: name,
        address: address,
        description: desc,
        city: city,
        country: country,
        image: ""
    }))
    try {
        const res = await fetch("../api/v1/parkings/" + parkId, {
            method: "PUT",
            body: formData
        })

        if (!res.ok) {
            throw await res.json()
        } else {
            window.location.href = "/detailParking" + "?" + "id=" + parkId
        }

    } catch (err) {
        let msg
        if(err.message == "Unexpected token < in JSON at position 0") {msg = "file non valido per immagine" } else  {msg = err.message}
        $("#message").text(msg)
        $("#message").removeAttr('hidden');
    }
}

async function getParkingData() {
    // get the park id from the url
    let parkId = window.location.href.split("?")[1].split("=")[1]
    // get the park data from the server
    let parkData = await fetch("../api/v1/parkings/" + parkId)
    parkData = await parkData.json()
    // fill the form with the park data
    $("#nome").val(parkData.name)
    $("#searchBar").val(parkData.address + ", " + parkData.city + ", " + parkData.country)
    $("#indirizzo").val(parkData.address)
    $("#citta").val(parkData.city)
    $("#nazione").val(parkData.country)
    $("#descrizione").val(parkData.description)
}

function toggleChooseFile() {
    if ($("#modifyImage").is(":checked")) {
        $("#choose-file").removeClass("invisible")
        $("#choose-file").addClass("visible")
    } else {
        $("#choose-file").removeClass("visible")
        $("#choose-file").addClass("invisible")
    }
}

function initAutocomplete() {
    // Create the search box and link it to the UI element.
    const searchBar = document.getElementById("searchBar")
    const searchBox = new google.maps.places.Autocomplete(searchBar)

    searchBox.addListener("place_changed", () => {
        $("#lat").val("")
        $("#long").val("")
        $("#indirizzo").val("")
        $("#message").attr('hidden', true);
        const place = searchBox.getPlace();

        if (!place.geometry || !place.geometry.location) {
            $("#message").text("Indirizzo non valido")
            $("#message").removeAttr('hidden');
            return;
        }

        const base = place.address_components.length === 8 ? 1 : 0;
        let address = place.address_components[base].long_name
        if(place.address_components.length === 8) {
            address += ", " + place.address_components[0].long_name
        }

        $("#lat").val(place.geometry.location.lat())
        $("#long").val(place.geometry.location.lng())
        $("#citta").val(place.address_components[base+1].long_name)
        $("#nazione").val(place.address_components[base+5].long_name)
        $("#indirizzo").val(address)
    });
}