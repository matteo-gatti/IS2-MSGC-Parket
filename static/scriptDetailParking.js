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
        return date + ":00+02:00"
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
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
        return
    }

    // check price format
    if (!$("#insertion-hourlyPrice").val().match(/^\d/)) {
        $("#message").removeAttr('hidden')
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        $("#message").text("Prezzo non valido")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
        return
    }

    // check price format
    if (!$("#insertion-dailyPrice").val().match(/^\d/)) {
        $("#message").removeAttr('hidden')
        $("#message").text("L'intervallo minimo deve essere maggiore di 0")
        $("#message").text("Prezzo non valido")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Crea inserzione")
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
                    timeStart: "2000-07-17T" + $("#recurrenceStartInput").val() + ":00+02:00",
                    timeEnd: "2000-07-17T" + $("#recurrenceEndInput").val() + ":00+02:00",
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
        $("#message").removeAttr('hidden')
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
            $("#btnModifica").attr("onclick", `modifyParking('${data._id}')`);

            if (data.image != "")
                $('#parkingImage').attr("src", data.image)
            $("#newInsertion").attr("data-bs-name", `${data.name}`);
            $("#newInsertion").attr("data-bs-id", `${data._id}`);

            $("#newReview").attr("data-bs-name", `${data.name}`);
            $("#newReview").attr("data-bs-id", `${data._id}`);
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

async function createReview() {
    try {
        // fetch the user from the database
        const id = $('#parkingId').html()

        let rating = 0
        for (let i = 5; i > 0; i--) {
            if ($(`#${i}`).prop("checked")) {
                rating = i
                break
            }
        }

        if(rating == 0) {
            throw {message: "Seleziona una valutazione"}
        }

        const res = await fetch(`/api/v1/parkings/${id}/reviews`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "title": $('#reviewTitle').val(),
                "description": $('#reviewDesc').val(),
                "stars": rating,
            })
        })

        if (!res.ok)
            throw {message: "Qualcosa è andato storto"}
        else {
            $('#close-review-modal').click()
            getReviews()
        }

    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}

async function getReviews() {
    /*
     <div id="reviewContainer">   -- accodare qui
     <div id="primaReview">  -- copiare questo
    
        campi
        reviewStars
        <span class="mr-2" id="reviewTitle">Titolo</span>
                          <span class="mr-2" id="space"> - </span>
                          <span class="mr-2" id="reviewUser">Utente</span>
                        </div>
                        <small id="reviewTime"></small>
                  </div>
                  <p class="text-justify comment-text mb-0" id="reviewDescription"></p>
    
     */

    const fullStar = '<i class="fa-solid fa-star mr-2" style="color: #ffc107"></i>'
    const emptyStar = '<i class="fa-solid fa-star mr-2" style="color: #eeeeee"></i>'

    try {
        //get all the reviews from the backend
        const id = $('#parkingId').html()
        const res = await fetch(`/api/v1/parkings/${id}/reviews`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok) {
            throw data
        }

        //load the reviews in the page
        const container = $('#reviewContainer')
        container.children().not(":first").remove()
        const reviewHTML = $('#primaReview')
        let starTot = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        for (review in data.reviews) {
            tmpInsHTML = reviewHTML.clone()
            tmpInsHTML.removeAttr("hidden")
            $(tmpInsHTML.find("span")[0]).html("<b>" + data.reviews[review].title + "</b>")
            $(tmpInsHTML.find("span")[2]).html("<i>" + data.reviews[review].writer.username + "</i>&nbsp;&nbsp;")
            $(tmpInsHTML.find("small")[0]).text(new Date(data.reviews[review].datetime).toLocaleString("it-IT").slice(0, -3))
            $(tmpInsHTML.find("p")[0]).text(data.reviews[review].description)

            for (let i = 0; i < data.reviews[review].stars; i++) {
                $(tmpInsHTML.find("div")[3]).append(fullStar)
            }
            for (let i = data.reviews[review].stars; i < 5; i++) {
                $(tmpInsHTML.find("div")[3]).append(emptyStar)
            }
            starTot[data.reviews[review].stars] += 1

            container.append(tmpInsHTML)
        }
        if(data.reviews.length == 0) 
        {
            $("#reviewContainer").css( "border", "1px solid #fff" );
            $("#reviewContainer").append(`<h3 class="fw-light px-4 py-5 text-center" id="noParks">Nessuna recensione 😭</h3>`)
        }

        $("#totalReviews").text(data.reviews.length)

        let starAvg = 0
        if (data.reviews.length != 0) {
            for (let i = 1; i <= 5; i++) {
                starAvg += i * starTot[i]
            }
            starAvg /= data.reviews.length
            starAvg = Math.round(starAvg * 10) / 10
        }
        $('#starAverage').text(starAvg)
        $('#starBar').attr("style", `width: ${starAvg * 20}%`)

        for (let i = 1; i <= 5; i++) {
            $('#' + i + 'starTot').text(starTot[i])
            $('#' + i + 'starBar').attr("style", `width: ${starTot[i] * 20}%`)
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

var exampleModal = document.getElementById('exampleModal')
exampleModal.addEventListener('show.bs.modal', function (event) {
    try {
        var button = event.relatedTarget
        var recipient = button.getAttribute('data-bs-name')
        var id = button.getAttribute('data-bs-id')
        
        $('#parkId').text(id)
        var modalTitle = exampleModal.querySelector('.modal-title')
        var modalBodyInput = exampleModal.querySelector('.modal-body input')
        
        modalTitle.textContent = 'Nuova inserzione per: ' + recipient
    } catch (err) {
        console.log(err)
    }
})

var reviewModal = document.getElementById('reviewModal')
reviewModal.addEventListener('show.bs.modal', function (event) {
    try {
        var button = event.relatedTarget
        var recipient = button.getAttribute('data-bs-name')
        var id = button.getAttribute('data-bs-id')
        
        $('#parkId').text(id)
        var modalTitle = reviewModal.querySelector('.modal-title')
        
        modalTitle.textContent = 'Nuova recensione per: ' + recipient
    } catch (err) {
        console.log(err)
    }
})

// datetimepicker logic
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
    viewDate: (new Date((new Date()).setHours(0, 0, 0, 0))),
    useCurrent: false
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
    viewDate: (new Date((new Date()).setHours(23, 59, 0, 0))),
    useCurrent: false
});

// using event listeners
const subscription1 = linked1Recurrence.subscribe(tempusDominus.Namespace.events.change, function (e) {
    console.log("1 updated 2", (linked2Recurrrence.dates._dates))
    linked2Recurrrence.updateOptions({
        restrictions: {
            minDate: e.date,
            maxDate: (new tempusDominus.DateTime((new Date()).setHours(23, 59, 0, 0)))
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
        useCurrent: false,
        //defaultDate: linked2Recurrrence.dates._dates[0]//(new Date((new Date()).setHours(23,59,0,0))),
        //defaultDate: linked2Recurrrence.dates._dates[0] == undefined ? ((new Date((new Date()).setHours(23,59,0,0)))) : (linked2Recurrrence.dates._dates[0]),//(new Date((new Date()).setHours(0,0,0,0))),
        viewDate: d2 == undefined ? ((new tempusDominus.DateTime((new Date()).setHours(23, 59, 0, 0)))) : (d2)//(new Date((new Date()).setHours(0,0,0,0))),

    });

});

// using subscribe method
const subscription2 = linked2Recurrrence.subscribe(tempusDominus.Namespace.events.change, (e) => {
    console.log("2 updated 1", (linked1Recurrence.dates._dates))
    linked1Recurrence.updateOptions({
        restrictions: {
            minDate: (new tempusDominus.DateTime((new Date()).setHours(0, 0, 0, 0))),
            maxDate: e.date
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
        useCurrent: false,
        //defaultDate: linked1Recurrence.dates._dates[0] == undefined ? ((new Date((new Date()).setHours(0,0,0,0)))) : (linked1Recurrence.dates._dates[0]),//(new Date((new Date()).setHours(0,0,0,0))),
        viewDate: d == undefined ? ((new tempusDominus.DateTime((new Date()).setHours(0, 0, 0, 0)))) : (d)//(new Date((new Date()).setHours(0,0,0,0))),
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
    await getReviews()
}

// navigate to the insertion page
function detailInsertion(insertionid) {
    window.location.href = `/insertion?insertion=${insertionid}`
}

// clear the modal every time it is closed
$('#exampleModal').on('hidden.bs.modal', function () {
    $('#exampleModal').find('form')[0].reset()
    $('#exampleModal').find('form')[1].reset()
    $("#recurrenceContainer").attr("hidden", "true")
    $('#btnSubmit').attr('onclick', `createInsertion()`)
    // clear the error message
    $("#message").text('')
    $("#message").attr('hidden', 'true')
})

function modifyInsertion(insertionid) {
    // retrieve old insertion data from the server
    fetch(`/api/v1/insertions/${insertionid}`)
        .then(response => response.json())
        .then(data => {
            var recurrent

            // fill the modal with the old data
            $("#insertion-name").val(data.name)

            // convert date to gg/mm/aaaa, hh:mm format
            var date = new Date(data.datetimeStart)
            date.setHours(date.getHours())
            var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
            var month = date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
            var year = date.getFullYear() < 10 ? '0' + date.getFullYear() : date.getFullYear()
            var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
            var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
            $('#linkedPickers1Input').val(`${day}/${month}/${year}, ${hours}:${minutes}`)

            // convert date to gg/mm/aaaa, hh:mm format
            date = new Date(data.datetimeEnd)
            date.setHours(date.getHours())
            day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
            month = date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
            year = date.getFullYear() < 10 ? '0' + date.getFullYear() : date.getFullYear()
            hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
            minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
            $('#linkedPickers2Input').val(`${day}/${month}/${year}, ${hours}:${minutes}`)

            linked1.updateOptions({
                restrictions: {
                    minDate: new tempusDominus.DateTime().startOf("minutes")
                },
                display: {
                    components: {
                        useTwentyfourHour: true
                    }
                },
                defaultDate: new Date(data.datetimeStart)
            });

            linked2.updateOptions({
                restrictions: {
                    minDate: new tempusDominus.DateTime().startOf("minutes")
                },
                display: {
                    components: {
                        useTwentyfourHour: true
                    }
                },
                defaultDate: new Date(data.datetimeEnd)
            });

            $('#insertion-hourlyPrice').val(data.priceHourly)
            $('#insertion-dailyPrice').val(data.priceDaily)
            $('#insertion-minInterval').val(data.minInterval)
            $('#recurrence').prop('checked', data.recurrence)

            recurrent = data.recurrent
            if (recurrent) {
                $("#recurrence").prop("checked", true)
                $("#recurrenceContainer").removeAttr("hidden")
                $('#monday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("monday"))
                $('#tuesday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("tuesday"))
                $('#wednesday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("wednesday"))
                $('#thursday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("thursday"))
                $('#friday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("friday"))
                $('#saturday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("saturday"))
                $('#sunday').prop('checked', data.recurrenceData.daysOfTheWeek.includes("sunday"))

                // convert date to hh:mm format
                dateStart = new Date(data.recurrenceData.timeStart)
                dateStart.setHours(dateStart.getHours())
                hoursStart = dateStart.getHours() < 10 ? "0" + dateStart.getHours() : dateStart.getHours()
                minutesStart = dateStart.getMinutes() < 10 ? "0" + dateStart.getMinutes() : dateStart.getMinutes()
                $('#recurrenceStartInput').val(`${hoursStart}:${minutesStart}`)

                // convert date to hh:mm format
                dateEnd = new Date(data.recurrenceData.timeEnd)
                dateEnd.setHours(dateEnd.getHours())
                hoursEnd = dateEnd.getHours() < 10 ? "0" + dateEnd.getHours() : dateEnd.getHours()
                minutesEnd = dateEnd.getMinutes() < 10 ? "0" + dateEnd.getMinutes() : dateEnd.getMinutes()
                $('#recurrenceEndInput').val(`${hoursEnd}:${minutesEnd}`)

                d = (new Date((new Date().setHours(hoursStart, minutesStart, 0, 0))))
                console.log("modify update 1", d)
                d2 = (new Date((new Date().setHours(hoursEnd, minutesEnd, 0, 0))))
                console.log("modify update 2", d2)

                linked1Recurrence.dates.setValue(new tempusDominus.DateTime(d))
                linked2Recurrrence.dates.setValue(new tempusDominus.DateTime(d2))

                /* linked1Recurrence.updateOptions({
                    restrictions: {
                        minDate: (new Date((new Date()).setHours(0,0,0,0)))
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
                    defaultDate: (new Date((new Date().setHours(hoursStart,minutesStart,0,0)))),
                    viewDate: (new Date((new Date().setHours(hoursStart,minutesStart,0,0)))),
                    useCurrent: false
                });
                //linked1Recurrence.dates._dates[0] = (new Date((new Date().setHours(hoursStart,minutesStart,0,0))))


                linked2Recurrrence.updateOptions({
                    restrictions: {
                        maxDate: (new Date((new Date()).setHours(23,59,0,0)))
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
                    defaultDate: (new Date((new Date().setHours(hoursEnd,minutesEnd,0,0)))),
                    viewDate: (new Date((new Date().setHours(hoursEnd,minutesEnd,0,0)))),
                    useCurrent: false
                }); */
                //linked2Recurrrence.dates._dates[0] = (new Date((new Date().setHours(hoursEnd,minutesEnd,0,0))))
            }

            $('#exampleModalLabel').text('Modifica inserzione')
            $('#btnSubmit').attr('onclick', `modifyInsertionSubmit('${insertionid}')`)

            // show modal
            $('#exampleModal').modal('show')
        })
        .catch(error => console.error(error))
}

async function modifyInsertionSubmit(insertionid) {
    $('#btnSubmit').prop("disabled", true)
    $('#btnSubmit').text("Invio ...")
    $("#message").attr('hidden')

    // convert the date to the right format
    function convertToISO(date) {
        splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
        splitDate[0] = splitDate[0].split("-")
        date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
        return date + ":00+02:00"
    }

    // check if the form is valid
    if (!$('form')[0].checkValidity()) {
        $("#message").removeAttr('hidden')
        $("#message").text("Per favore inserire tutti i dati")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Invia")
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
        $('#btnSubmit').text("Invia")
        return
    }

    try {
        // fetch the insertion from the database
        const res = await fetch(`../api/v1/insertions/${insertionid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: insertionid,
                name: name,
                datetimeStart: d1,
                datetimeEnd: d2,
                priceHourly: $("#insertion-hourlyPrice").val(),
                priceDaily: $("#insertion-dailyPrice").val(),
                minInterval: $("#insertion-minInterval").val(),
                recurrent: $("#recurrence").is(":checked"),
                // if recurrent is false, do not send recurrence data
                recurrenceData: $("#recurrence").is(":checked") ? {
                    daysOfTheWeek: days,
                    timeStart: "2000-07-17T" + $("#recurrenceStartInput").val() + ":00+02:00",
                    timeEnd: "2000-07-17T" + $("#recurrenceEndInput").val() + ":00+02:00",
                } : null
            }),
        })

        // if the response is not ok, throw data
        if (!res.ok) {
            throw await res.json()
        } else {
            // if the insertion ismodified, close the modal
            $('#close-modal').click()
            $('#btnSubmit').prop("disabled", false)
            $('#btnSubmit').text("Invia")
            $(':input', 'form')
                .not(':button, :submit, :reset, :hidden')
                .val('')
                .prop('checked', false)
                .prop('selected', false);

            linked1Recurrence.dates.setValue(new tempusDominus.DateTime(new Date().setHours(0, 0, 0, 0)))

            linked2Recurrrence.dates.setValue(new tempusDominus.DateTime(new Date().setHours(23, 59, 0, 0)))
            // and reload the insertions
            await getMyInsertions()
        }
    } catch (err) {
        // if the insertion is not modified, show the error message
        $("#message").text(err.message)
        $("#message").removeAttr('hidden')
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Invia")
    }
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

async function modifyParking(parkId) {
    // call newPark page and pass the park id
    window.location.href = `/modifyParking?park=${parkId}`
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