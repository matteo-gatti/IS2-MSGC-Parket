async function createInsertion() {
    $('#btnSubmit').prop("disabled", true)
    $('#btnSubmit').text("Invio ...")
    $("#message").attr('hidden')

    function convertToISO(date) {
        splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
        splitDate[0] = splitDate[0].split("-")
        date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
        return date + ":00+01:00"
    }


    if (!$('form')[0].checkValidity()) {
        $("#message").removeAttr('hidden')
        $("#message").text("Per favore inserire tutti i dati")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
        return
    }

    // show error if the min interval is lower than 0
    if ($("#insertion-minInterval").val() < 0) {
        $("#message").removeAttr('hidden')
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        return
    }

    // check price format
    if (!$("#insertion-hourlyPrice").val().match(/^\d/)) {
        $("#message").removeAttr('hidden')
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        $("#message").text("Prezzo non valido")
        return
    }

    // check price format
    if (!$("#insertion-dailyPrice").val().match(/^\d/)) {
        $("#message").removeAttr('hidden')
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        $("#message").text("Prezzo non valido")
        return
    }

    const id = $("#parkId").text()
    const name = $("#insertion-name").val()
    let d1 = $("#linkedPickers1Input").val()
    let d2 = $("#linkedPickers2Input").val()

    d1 = convertToISO(d1)
    d2 = convertToISO(d2)

    // convert days in array
    const days = []

    $("#dayCheckboxes div div .form-check-input").each((i, checkbox) => {
        if (checkbox.checked) days.push(checkbox.id)
    });

    // if days is empty, return error message
    if ($("#recurrence").is(":checked") && days.length === 0) {
        $("#message").removeAttr('hidden')
        $("#message").text("Per favore selezionare almeno un giorno")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
        return
    }

    console.log(days)

    try {
        const res = await fetch(`../api/v1/parkings/${id}/insertions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                datetimeStart: d1,
                datetimeEnd: d2,
                priceHourly: $("#insertion-hourlyPrice").val(),
                priceDaily: $("#insertion-dailyPrice").val(),
                minInterval: $("#insertion-minInterval").val(),
                // TODO: da controllare
                recurrent: $("#recurrence").is(":checked"),
                recurrenceData: {
                    daysOfTheWeek: days,
                    timeStart: "2000-07-17T" + $("#recurrenceStartInput").val() + ":00+01:00",
                    timeEnd: "2000-07-17T" + $("#recurrenceEndInput").val() + ":00+01:00",
                },
                // TODO: da controllare
            }),
        })
        console.log(res)
        // data = await res.json()
        if (!res.ok) {
            throw await res.json()
        } else {
            $('#close-modal').click()
            $('#btnSubmit').prop("disabled", false)
            $('#btnSubmit').text("Crea inserzione")
            $(':input','form')
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
            await getMyInsertions()
        }
    } catch (err) {
        console.log("ERROR", err)
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
    }

}

async function loadDetails() {
    // get the values from the form
    //const identifier = $("#identifier").val()
    //const password = $("#password").val()
    console.log("getting details")
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("id")) {
            throw { message: "id not in URL" }
        }
        // fetch the user from the database
        const res = await fetch(`/api/v1/parkings/${urlParams.get('id')}`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        console.log("data", data)
        if (data) {

            $("#parkingName").text(data.name)
            $("#parkingDesc").text(data.description)
            $("#parkingAddress").text(data.address)// + " " + data.city + " " + data.country)
            $("#parkingCity").text(data.city)
            $("#parkingCountry").text(data.country)
            $("#parkingId").text(data._id)
            $("#lblVisible").text(data.visible === true ? "Sì" : "No")
            $("#btnVisible").removeClass(data.visible === true ? "btn-danger" : "btn-success")
            $("#btnVisible").addClass(data.visible === true ? "btn-success" : "btn-danger")
            console.log("IMG", data.image)
            if (data.image != "")
                $('#parkingImage').attr("src", data.image)
            $("#newInsertion").attr("data-bs-name", `${data.name}`);
            $("#newInsertion").attr("data-bs-id", `${data._id}`);
        }

    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        //alert("Wrong email or password");
    }
}

function goBack() {
    //window.location.href = "/privateArea"
    history.back()
}

async function getMyInsertions() {
    // get the values from the form
    //const identifier = $("#identifier").val()
    //const password = $("#password").val()
    console.log("getting insertions")
    try {
        // fetch the user from the database
        const id = $('#parkingId').html()
        console.log(id)
        console.log("req" + `/api/v1/parkings/${id}/insertions`)
        const res = await fetch(`/api/v1/parkings/${id}/insertions`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        console.log("data", data)
        if (data) {
            //console.log(data)
            const container = $('#insertionContainer')
            container.children().not(":first").remove()
            const insertionHTML = $('#firstInsertion')
            for (insertion in data.insertions) {
                tmpInsHTML = insertionHTML.clone()
                tmpInsHTML.removeAttr("hidden")
                $(tmpInsHTML.find("p")[0]).text(data.insertions[insertion].name)
                $(tmpInsHTML.find("p")[1]).text(data.insertions[insertion]._id)
                $(tmpInsHTML.find("button")[0]).attr("onclick", `detailInsertion('${data.insertions[insertion]._id}')`);
                container.append(tmpInsHTML)
            }
        }

    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        //alert("Wrong email or password");
    }
}

async function toggleVisible() {
    // get the values from the form
    //const identifier = $("#identifier").val()
    //const password = $("#password").val()
    console.log("toggling visible")
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("id")) {
            throw { message: "id not in URL" }
        }
        const lblVisible = $("#lblVisible").text()
        // fetch the user from the database
        const res = await fetch(`/api/v1/parkings/${urlParams.get('id')}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                visible: lblVisible === "Sì" ? false : true
            })
        })
        data = await res.json()

        if (!res.ok)
            throw data

        console.log("data", data)
        if (data) {
            $("#lblVisible").text(data.visible ? "Sì" : "No")
            $("#btnVisible").removeClass(data.visible ? "btn-danger" : "btn-success")
            $("#btnVisible").addClass(data.visible ? "btn-success" : "btn-danger")
        }

    } catch (err) {
        console.log(err.message)
        //alert("Wrong email or password");
    }
}

var exampleModal = document.getElementById('exampleModal')
exampleModal.addEventListener('show.bs.modal', function (event) {
    // Button that triggered the modal
    console.log("click inser")
    var button = event.relatedTarget
    // Extract info from data-bs-* attributes
    var recipient = button.getAttribute('data-bs-name')
    var id = button.getAttribute('data-bs-id')
    console.log(id)
    $('#parkId').text(id)
    // If necessary, you could initiate an AJAX request here
    // and then do the updating in a callback.
    //
    // Update the modal's content.
    var modalTitle = exampleModal.querySelector('.modal-title')
    var modalBodyInput = exampleModal.querySelector('.modal-body input')

    modalTitle.textContent = 'Nuova inserzione per: ' + recipient
})
tempusDominus.loadLocale(tempusDominus.locales.it);

//globally
tempusDominus.locale(tempusDominus.locales.it.name);
// date time
const linkedPicker1ElementRecurrence = document.getElementById('recurrenceStartInput');
const linked1Recurrence = new tempusDominus.TempusDominus(linkedPicker1ElementRecurrence);
//linked1.locale(localization)
linked1Recurrence.updateOptions({
    display: {
        viewMode: "clock",
        components: {
            useTwentyfourHour: true,
            decades: false,
            year: false,
            month: false,
            date: false,
            hours: true,
            minutes: true,
            seconds: false
        }
    },
    defaultDate: (new Date((new Date()).setHours(0,0,0,0))),
})

const linked2Recurrrence = new tempusDominus.TempusDominus(document.getElementById('recurrenceEndInput'), {
        display: {
            viewMode: "clock",
            components: {
                useTwentyfourHour: true,
                decades: false,
                year: false,
                month: false,
                date: false,
                hours: true,
                minutes: true,
                seconds: false
            }
        },
        defaultDate: (new Date((new Date()).setHours(23,59,0,0))),
});

//using event listeners
linkedPicker1ElementRecurrence.addEventListener(tempusDominus.Namespace.events.change, (e) => {
    linked2Recurrrence.updateOptions({
        restrictions: {
            minDate: e.detail.date//new Date(e.detail.date.getHours() + ":" + e.detail.date.getMinutes())
        },
        display: {
            viewMode: "clock",
            components: {
                useTwentyfourHour: true,
                decades: false,
                year: false,
                month: false,
                date: false,
                hours: true,
                minutes: true,
                seconds: false
            }
        },
        defaultDate: (new Date((new Date()).setHours(0,0,0,0))),
    });

});

//using subscribe method
const subscription2 = linked2Recurrrence.subscribe(tempusDominus.Namespace.events.change, (e) => {
    linked1Recurrence.updateOptions({
        restrictions: {
            maxDate: e.date//new Date(e.date.getHours() + ":" + e.date.getMinutes())
        },
        display: {
            viewMode: "clock",
            components: {
                useTwentyfourHour: true,
                decades: false,
                year: false,
                month: false,
                date: false,
                hours: true,
                minutes: true,
                seconds: false
            }
        },
        defaultDate: (new Date((new Date()).setHours(23,59,0,0))),
    });
});

//--------------------------------- period datepickers ---------------------------------------
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
//--------------------------------- end period datepickers ------------------------------------

// TODO: fa schifo, ma va
function toggleRecurrence() {
    if ($("#recurrence").is(":checked")) {
        $("#recurrenceContainer").removeAttr("hidden")
    } else {
        $("#recurrenceContainer").attr("hidden", "true")
    }
}
// TODO: da controllare

async function main() {
    //x=true
    await loadDetails()
    await getMyInsertions()
}
main()