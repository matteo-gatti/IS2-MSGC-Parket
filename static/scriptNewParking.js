async function createParking() {
    var name = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();
    var image = $("#image").prop("files")[0];
    var lat = $("#lat").val();
    var long = $("#long").val();

    const formData = new FormData();

    //create payload with image and json
    formData.append('image', image)
    formData.append('json', JSON.stringify({
        name: name,
        address: address,
        description: desc,
        city: city,
        country: country,
        image: "",
        latitude: lat,
        longitude: long
    }))
    try {
        const res = await fetch("../api/v1/parkings", {
            method: "POST",
            body: formData
        })

        if (!res.ok) {

            throw await res.json()
        } else {
            window.location.href = "/privateArea"
        }

    } catch (err) {
        let msg
        if (err.message == "Unexpected token < in JSON at position 0") { msg = "file non valido per immagine" } else { msg = err.message }
        $("#message").text(msg)
        $("#message").removeAttr('hidden');
    }
}

let autocomplete;
let addressField;
function initAutocomplete() {
    addressField = document.querySelector("#indirizzo");
    // Create the autocomplete object, restricting the search predictions to
    // addresses in the US and Canada.
    autocomplete = new google.maps.places.Autocomplete(addressField, {
        fields: ["address_components", "geometry"],
        types: ["address"],
    });
    
    // When the user selects an address from the drop-down, populate the
    // address fields in the form.
    autocomplete.addListener("place_changed", fillInAddress);
}

function fillInAddress() {
    // Get the place details from the autocomplete object.
    const place = autocomplete.getPlace();
    let address1 = "";

    for (const component of place.address_components) {
        const componentType = component.types[0];

        switch (componentType) {
            case "street_number": {
                address1 = `${component.long_name}`;
                break;
            }
            case "route": {
                number = address1
                address1 = `${component.long_name}`;
                if (number != "") address1 += ", " + number
                break;
            }
            case "locality":
                document.querySelector("#citta").value = component.long_name;
                break;
            case "country":
                document.querySelector("#nazione").value = component.long_name;
                break;
        }
    }

    addressField.value = address1;
    document.querySelector("#lat").value = place.geometry.location.lat();
    document.querySelector("#long").value = place.geometry.location.lng();
}

window.initAutocomplete = initAutocomplete;