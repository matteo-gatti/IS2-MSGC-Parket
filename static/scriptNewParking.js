async function createParking() {
    var name = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();
    var image = $("#foto").val();
    try {
        const res = await fetch("../api/v1/parkings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                address: address,
                description: desc,
                city: city,
                country: country,
                image: image
            }),
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
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}