// Create a new insertion
async function createInsertion() {
    $('#btnSubmit').prop("disabled", true)
    $('#btnSubmit').text("Invio ...")
    $("#message").attr('hidden')

    // convert the date to the right format
    function convertToISO(date) {
        splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
        splitDate[0] = splitDate[0].split("-")
        date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
        return date + ":00+01:00"
    }

    // check if the form is valid
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

    // push the days in the array
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

    try {
        // fetch the insertion from the database
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
                recurrent: $("#recurrence").is(":checked"),
                recurrenceData: {
                    daysOfTheWeek: days,
                    timeStart: "2000-07-17T" + $("#recurrenceStartInput").val() + ":00+01:00",
                    timeEnd: "2000-07-17T" + $("#recurrenceEndInput").val() + ":00+01:00",
                },
            }),
        })

        // if the response is not ok, throw data
        if (!res.ok) {
            throw await res.json()
        } else {
            // if the insertion is created, close the modal
            $('#close-modal').click()
            $('#btnSubmit').prop("disabled", false)
            $('#btnSubmit').text("Crea inserzione")
            $(':input', 'form')
                .not(':button, :submit, :reset, :hidden')
                .val('')
                .prop('checked', false)
                .prop('selected', false);
            // and reload the insertions
            await getMyInsertions()
        }
    } catch (err) {
        // if the insertion is not created, show the error message
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
    }

}

// load the details of the parking
async function loadDetails() {
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

        // load the data in the page
        console.log(data)
        if (data) {
            $("#parkingName").text(data.name)
            $("#parkingDesc").text(data.description)
            $("#parkingAddress").text(data.address)
            $("#parkingCity").text(data.city)
            $("#parkingCountry").text(data.country)
            $("#parkingId").text(data._id)
            $("#lblVisible").text(data.visible === true ? "Sì" : "No")
            $("#btnVisible").removeClass(data.visible ? "btn-outline-dark" : "btn-outline-success")
            $("#btnVisible").addClass(data.visible ? "btn-outline-success" : "btn-outline-dark")
            $("#btnElimina").attr("onclick", `deleteParking('${data._id}')`);

            if (data.image != "")
                $('#parkingImage').attr("src", data.image)
            $("#newInsertion").attr("data-bs-name", `${data.name}`);
            $("#newInsertion").attr("data-bs-id", `${data._id}`);
        }
    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}

// go back to the parkings page
function goBack() {
    //go back to previous page
    window.location = document.referrer
}

// load the insertions of the parking
async function getMyInsertions() {
    try {
        // fetch the user from the database
        const id = $('#parkingId').html()

        const res = await fetch(`/api/v1/parkings/${id}/insertions`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        // load the data in the page
        if (data) {
            const container = $('#insertionContainer')
            container.children().not(":first").remove()
            const insertionHTML = $('#firstInsertion')
            for (insertion in data.insertions) {
                tmpInsHTML = insertionHTML.clone()
                tmpInsHTML.removeAttr("hidden")
                $(tmpInsHTML.find("p")[0]).text(data.insertions[insertion]._id)
                $(tmpInsHTML.find("p")[1]).html("<b>&nbsp;&nbsp;&nbsp;Nome: </b> " + data.insertions[insertion].name)
                $(tmpInsHTML.find("p")[2]).html("<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Da: </b>" + (new Date(data.insertions[insertion].datetimeStart)).toLocaleString("it-IT").slice(0, -3))
                $(tmpInsHTML.find("p")[3]).html("<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A: </b> " + (new Date(data.insertions[insertion].datetimeEnd)).toLocaleString("it-IT").slice(0, -3))
                let strPrezzo = "<b>&nbsp;&nbsp;Prezzo: </b> " + data.insertions[insertion].priceHourly.toLocaleString('it-IT',
                    {
                        style: 'currency',
                        currency: 'EUR',
                    }) + "/ora"
                if (data.insertions[insertion].priceDaily != null) {
                    strPrezzo += " - " + data.insertions[insertion].priceDaily.toLocaleString('it-IT',
                        {
                            style: 'currency',
                            currency: 'EUR',
                        }) + "/giorno"
                }
                $(tmpInsHTML.find("p")[4]).html(strPrezzo)
                let fullSelf = data.insertions[insertion].self.split("/")

                let insertionid = fullSelf[4]

                $(tmpInsHTML.find("button")[0]).attr("onclick", `detailInsertion('${insertionid}')`);
                $(tmpInsHTML.find("button")[1]).attr("onclick", `modifyInsertion('${insertionid}')`);
                $(tmpInsHTML.find("button")[2]).attr("onclick", `deleteInsertion('${insertionid}')`);
                container.append(tmpInsHTML)
            }
        }

    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}

// toggle the visibility of the parking
async function toggleVisible() {
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

        console.log(data)
        // update the visibility button in the page
        if (data) {
            $("#lblVisible").text(data.visible ? "Sì" : "No")
            $("#btnVisible").removeClass(data.visible ? "btn-outline-dark" : "btn-outline-success")
            $("#btnVisible").addClass(data.visible ? "btn-outline-success" : "btn-outline-dark")
        }

    } catch (err) {
        $("#message").removeAttr('hidden')
        $("#message").text(err.message)
    }
    //loadDetails()
}

// datetimepicker logic
var exampleModal = document.getElementById('exampleModal')
exampleModal.addEventListener('show.bs.modal', function (event) {
    var button = event.relatedTarget
    var recipient = button.getAttribute('data-bs-name')
    var id = button.getAttribute('data-bs-id')

    $('#parkId').text(id)
    var modalTitle = exampleModal.querySelector('.modal-title')
    var modalBodyInput = exampleModal.querySelector('.modal-body input')

    modalTitle.textContent = 'Nuova inserzione per: ' + recipient
})
tempusDominus.loadLocale(tempusDominus.locales.it);

// globally
tempusDominus.locale(tempusDominus.locales.it.name);
// date time
const linkedPicker1ElementRecurrence = document.getElementById('recurrenceStartInput');
const linked1Recurrence = new tempusDominus.TempusDominus(linkedPicker1ElementRecurrence);
// linked1.locale(localization)
linked1Recurrence.updateOptions({
    restrictions: {
        minDate: (new Date((new Date()).setHours(0, 0, 0, 0))),
        maxDate: (new Date((new Date()).setHours(23, 59, 0, 0)))
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
    defaultDate: (new Date((new Date()).setHours(0, 0, 0, 0))),
})

const linked2Recurrrence = new tempusDominus.TempusDominus(document.getElementById('recurrenceEndInput'), {
    restrictions: {
        minDate: (new Date((new Date()).setHours(0, 0, 0, 0))),
        maxDate: (new Date((new Date()).setHours(23, 59, 0, 0)))
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
    defaultDate: (new Date((new Date()).setHours(23, 59, 0, 0))),
});

// using event listeners
linkedPicker1ElementRecurrence.addEventListener(tempusDominus.Namespace.events.change, (e) => {
    linked2Recurrrence.updateOptions({
        restrictions: {
            minDate: e.detail.date,
            maxDate: (new Date((new Date()).setHours(23, 59, 0, 0)))
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
        defaultDate: (new Date((new Date()).setHours(0, 0, 0, 0))),
    });

});

// using subscribe method
const subscription2 = linked2Recurrrence.subscribe(tempusDominus.Namespace.events.change, (e) => {
    linked1Recurrence.updateOptions({
        restrictions: {
            minDate: (new Date((new Date()).setHours(0, 0, 0, 0))),
            maxDate: e.detail.date
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
        defaultDate: (new Date((new Date()).setHours(23, 59, 0, 0))),
    });
});

//--------------------------------- period datepickers ---------------------------------------
const linkedPicker1Element = document.getElementById('linkedPickers1');
const linked1 = new tempusDominus.TempusDominus(linkedPicker1Element);

linked1.updateOptions({
    restrictions: {
        minDate: new tempusDominus.DateTime().startOf("minutes")
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

// using event listeners
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

// using subscribe method
const subscription = linked2.subscribe(tempusDominus.Namespace.events.change, (e) => {
    linked1.updateOptions({
        restrictions: {
            minDate: new tempusDominus.DateTime().startOf("minutes"),
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
function toggleRecurrence() {
    if ($("#recurrence").is(":checked")) {
        $("#recurrenceContainer").removeAttr("hidden")
    } else {
        $("#recurrenceContainer").attr("hidden", "true")
    }
}

// launch main function and initialize the page
async function main() {
    await loadDetails()
    await getMyInsertions()
}

// navigate to the insertion page
function detailInsertion(insertionid) {
    window.location.href = `/insertion?insertion=${insertionid}`
}

function modifyInsertion(insertionid) {
    alert(`TODO edit ${insertionid}`)
}

async function deleteInsertion(insertionid) {
    //chiamata per eliminare la reservation
    if (confirm('Are you sure you want to delete this insertion?')) {
        try {
            const res = await fetch(`/api/v1/insertions/${insertionid}`, {
                method: "DELETE",
            });
            data = await res.json();

            if (!res.ok) throw data;
            //refresh
            await getMyInsertions()
        } catch (err) {
            console.log(err)
            alert(err.message)
        }
    }
}

async function deleteParking(parkingid) {
    console.log(parkingid)
    if (confirm('Are you sure you want to delete this parking?')) {
        try {
            const res = await fetch(`/api/v1/parkings/${parkingid}`, {
                method: "DELETE",
            });
            data = await res.json();

            if (!res.ok) throw data;
            //refresh
            window.location.href = "/privateArea"
        } catch (err) {
            console.log(err)
            alert(err.message)
        }
    }
}

// avoid possible input errors from keyboard
$('#insertion-hourlyPrice').keypress(function (e) {
    var txt = String.fromCharCode(e.which);
    if (!txt.match(/[0-9,]/)) {
        return false;
    }
})

// avoid possible input errors from keyboard
$('#insertion-dailyPrice').keypress(function (e) {
    var txt = String.fromCharCode(e.which);
    if (!txt.match(/[0-9,]/)) {
        return false;
    }
})

// avoid possible input errors from keyboard
$('#insertion-minInterval').keypress(function (e) {
    var txt = String.fromCharCode(e.which);
    if (!txt.match(/[0-9]/)) {
        return false;
    }
})

main()