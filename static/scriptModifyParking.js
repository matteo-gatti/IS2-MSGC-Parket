$(document).ready(getParkingData)

async function editParking() {
    // get the park id from the url
    let parkId = window.location.href.split("?")[1].split("=")[1]

    var name = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();

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
            window.location.href = "/privateArea"
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
    $("#indirizzo").val(parkData.address)
    $("#descrizione").val(parkData.description)
    $("#citta").val(parkData.city)
    $("#nazione").val(parkData.country)
}

function toggleChooseFile() {
    if ($("#modifyImage").is(":checked")) {
        $("#choose-file").removeAttr("hidden")
    } else {
        $("#choose-file").attr("hidden", "true")
    }
}