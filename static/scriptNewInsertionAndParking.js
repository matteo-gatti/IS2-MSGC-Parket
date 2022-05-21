// Create new parking and insertion
async function createNewInsertionAndParking() {
    $('#btnSubmit').prop("disabled", true)
    $('#btnSubmit').text("Invio ...")
    $("#message").attr('hidden')



    function convertToISO(date) {
        splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
        splitDate[0] = splitDate[0].split("-")
        date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
        return date + ":00+01:00"
    }

    if (!$('form')[0].checkValidity() || !$('form')[1].checkValidity()) {
        $("#message").removeAttr('hidden')
        $("#message").text("Per favore inserire tutti i dati")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Aggiungi Inserzione e Parcheggio")
        return
    }

    // show error if the min interval is lower than 0
    if ($("#insertion-minInterval").val() < 0) {
        $("#message").removeAttr('hidden')
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Aggiungi Inserzione e Parcheggio")
        return
    }

    // check price format
    if (!$("#insertion-hourlyPrice").val().match(/^\d/)) {
        $("#message").removeAttr('hidden')
        $("#message").text("Prezzo non valido")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Aggiungi Inserzione e Parcheggio")
        return
    }

    // check price format
    if (!$("#insertion-dailyPrice").val().match(/^\d/)) {
        $("#message").removeAttr('hidden')
        $("#message").text("Prezzo non valido")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Aggiungi Inserzione e Parcheggio")
        return
    }

    const id = $("#parkId").text()
    const name = $("#insertion-name").val()
    let d1 = $("#linkedPickers1Input").val()
    let d2 = $("#linkedPickers2Input").val()

    d1 = convertToISO(d1)
    d2 = convertToISO(d2)
    //Parking
    var nameParking = $("#nome").val();
    var address = $("#indirizzo").val();
    var desc = $("#descrizione").val();
    var city = $("#citta").val();
    var country = $("#nazione").val();
    var image = $("#image").prop("files")[0];

    const formData = new FormData();

    formData.append('image', image)
    formData.append('parking', JSON.stringify({
        name: nameParking,
        address: address,
        description: desc,
        city: city,
        country: country,
        image: ""
    }))

    formData.append('insertion', JSON.stringify({
        name: name,
        datetimeStart: d1,
        datetimeEnd: d2,
        priceHourly: $("#insertion-hourlyPrice").val(),
        priceDaily: $("#insertion-dailyPrice").val(),
        minInterval: $("#insertion-minInterval").val(),
    }))

    try {
        const res = await fetch('../api/v1/insertions', {
            method: "POST",
            body: formData
        })
        console.log(res)
        //const data = await res.json()
        if (!res.ok) {
            throw await res.json()
        } else {
            console.log("Fatto")
            window.location.href = "privateArea"
        }

        //if()
        //  console.log("ciao mamma")
    } catch (err) {
        console.log("ERROR", err)
        $("#message").text(err.message)
        $("#message").removeAttr('hidden')
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Aggiungi Inserzione e Parcheggio")
    }

}

tempusDominus.loadLocale(tempusDominus.locales.it);

//globally
tempusDominus.locale(tempusDominus.locales.it.name);
// date time
const linkedPicker1Element = document.getElementById('linkedPickers1');
const linked1 = new tempusDominus.TempusDominus(linkedPicker1Element);
//linked1.locale(localization)
linked1.updateOptions({
    restrictions: {
        minDate: new tempusDominus.DateTime().startOf("minutes")
        //minDate: tempusDominus.DateTime.format()
    },
    display: {
        components: {
            useTwentyfourHour: true
        }
    }
})

const linked2 = new tempusDominus.TempusDominus(document.getElementById('linkedPickers2'), {
    useCurrent: false,
    display: {
        components: {
            useTwentyfourHour: true
        }
    }
});

//using event listeners
linkedPicker1Element.addEventListener(tempusDominus.Namespace.events.change, (e) => {
    linked2.updateOptions({
        restrictions: {
            minDate: e.detail.date
        },
        display: {
            components: {
                useTwentyfourHour: true
            }
        }
    });
});

//using subscribe method
const subscription = linked2.subscribe(tempusDominus.Namespace.events.change, (e) => {
    linked1.updateOptions({
        restrictions: {
            maxDate: e.date
        },
        display: {
            components: {
                useTwentyfourHour: true
        }
    }
    });
});