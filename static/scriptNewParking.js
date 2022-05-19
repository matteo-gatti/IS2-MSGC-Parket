
async function createParking() {
    var name = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();
    var image = $("#image").prop("files")[0];

    const formData = new FormData();

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
        
        //inserisco foto.. stringa di uri,

        const res = await fetch("../api/v1/parkings", {
            method: "POST",
            //headers: { "Content-Type": "application/json" },
            body: formData
        })

        if (!res.ok) {
            
            throw await res.json()
        } else {
            window.location.href = "/privateArea"
        }

        //if()
          //  console.log("ciao mamma")
    } catch (err) {
        console.log("ERROR", err)
        let msg
        if(err.message == "Unexpected token < in JSON at position 0") {msg = "file non valido per immagine" }else  {msg = err.message}
        $("#message").text(msg)
        $("#message").removeAttr('hidden');
    }
}