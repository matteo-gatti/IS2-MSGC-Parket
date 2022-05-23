async function createParking() {
    var name = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();
    var image = $("#image").prop("files")[0];

    const formData = new FormData();

    //create payload with image and json
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
        if(err.message == "Unexpected token < in JSON at position 0") {msg = "file non valido per immagine" }else  {msg = err.message}
        $("#message").text(msg)
        $("#message").removeAttr('hidden');
    }
}