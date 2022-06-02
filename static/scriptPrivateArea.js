async function getMyParkings() {
    try {
        // fetch the user from the database
        const res = await fetch("/api/v1/parkings/myParkings", {
            method: "GET",
        });
        data = await res.json();

        if (!res.ok) throw data;

        if (data) {
            const container = $("#parkContainer");
            const parkingHTML = $("#firstPark");
            for (parking in data) {
                tmpParkHTML = parkingHTML.clone();
                tmpParkHTML.removeAttr("hidden");
                $(tmpParkHTML.find("p")[0]).text(data[parking].name);
                $(tmpParkHTML.find("p")[2]).text(
                    data[parking].address +
                        " " +
                        data[parking].city +
                        " " +
                        data[parking].country
                );
                $(tmpParkHTML.find("p")[3]).text(data[parking].self);
                $(tmpParkHTML.find("button")[0]).attr(
                    "onclick",
                    `detailParking('${data[parking]._id}')`
                );
                $(tmpParkHTML.find("img")[0]).attr("src", data[parking].image);
                container.append(tmpParkHTML);
            }
            if (data.parkings.length === 0) {
                $("#noParks").removeAttr("hidden");
            }
        }
    } catch (err) {
        $("#message").text(err.message);
        $("#message").removeAttr("hidden");
    }
}
function newParking() {
    window.location.href = "/createParking";
}
getMyParkings();

function detailParking(id) {
    window.location.href = "/detailParking?id=" + id;
}

function newParkingFromInsertion() {
    window.location.href = "/createParkingInsertion";
}

async function loadData() {
    try {
        // fetch the user from the database
        var id = $("#usrId").text();

        const res = await fetch(`/api/v1/users/${id}`, {
            method: "GET",
        });
        data = await res.json();

        if (!res.ok) throw data;

        if (data) {
            $("#username").text(data.username);
            $("#userEmail").text(data.email);
            $("#userNameSurname").text(data.name + " " + data.surname);
        }
    } catch (err) {}
}

async function loadPrenotazioni() {
    const res = await fetch(`/api/v1/reservations/myReservations`, {
        method: "GET",
    });
    data = await res.json();

    if (!res.ok) throw data;

    let container = $("#reservList");
    if (data.length === 0) {
        $("#msgNoReservations").removeAttr("hidden");
    }
    for (i in data) {
        data[i].datetimeStart = new Date(data[i].datetimeStart)
            .toLocaleString("it-IT")
            .slice(0, -3);
        data[i].datetimeEnd = new Date(data[i].datetimeEnd)
            .toLocaleString("it-IT")
            .slice(0, -3);
            let id = data[i].self.split("/")[4]
        tmpHTML =
            '<div class="col-sm-4 mb-3">' +
            '<p class="m-b-10 f-w-600">' +
            "<a style='text-decoration:none' href=insertion?insertion=" +
            data[i].insertion._id +
            ">" +
            data[i].insertion.name +
            "</a> - " +
            "<a style='text-decoration:none' href=detailParking?id=" +
            data[i].insertion.parking._id +
            ">" +
            data[i].insertion.parking.name +
            "</a></p>" +
            "<h6 class='d-inline'>Contatto: </h6><span class='text-muted' style='font-size: 14px;'>" +
            data[i].insertion.parking.owner.email +
            "</span><br>" +
            "<h6 class=\"d-inline\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Da: </h6><span class='text-muted' style='font-size: 14px;'>" +
            data[i].datetimeStart +
            "</span>" +
            "<br><h6 class='d-inline'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A: </h6><span class='text-muted' style='font-size: 14px;'>" +
            data[i].datetimeEnd +
            "</span>" +
            "<br><h6 class='d-inline'>Costo: </h6><span class='text-muted' style='font-size: 14px;'>" +
            data[i].price.toLocaleString("it-IT", {
                style: "currency",
                currency: "EUR",
            }) +
            "</span><br>" +
            "<div class=\"mt-1 d-flex gap-2 flex-wrap\">" +
            `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="modifyReserv('${id}')" > Modifica </button>` +
            `<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeReserv('${id}')" > Elimina </button>` +
            "</div>" +
            "</div>";

        container.append(tmpHTML);
    }
}

// datetimepicker logic
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
tempusDominus.loadLocale(tempusDominus.locales.it);

// globally
tempusDominus.locale(tempusDominus.locales.it.name);

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

// clear the modal every time it is closed
$('#exampleModal').on('hidden.bs.modal', function () {
    $('#exampleModal').find('form')[0].reset()
    // clear the error message
    $("#message-modal").text('')
    $("#message-modal").attr('hidden', 'true')
})

// modify reservation
async function modifyReserv(reservationId) {
    // retrieve old reservation data from the server
    fetch(`/api/v1/reservations/${reservationId}`)
        .then(response => response.json())
        .then(data => {
            
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
            var date2 = new Date(data.datetimeEnd)
            date2.setHours(date2.getHours())
            day = date2.getDate() < 10 ? '0' + date2.getDate() : date2.getDate()
            month = date2.getMonth() < 10 ? '0' + (date2.getMonth() + 1) : date2.getMonth() + 1
            year = date2.getFullYear() < 10 ? '0' + date2.getFullYear() : date2.getFullYear()
            hours = date2.getHours() < 10 ? '0' + date2.getHours() : date2.getHours()
            minutes = date2.getMinutes() < 10 ? '0' + date2.getMinutes() : date2.getMinutes()
            $('#linkedPickers2Input').val(`${day}/${month}/${year}, ${hours}:${minutes}`)

            linked1.updateOptions({
                display: {
                    components: {
                        useTwentyfourHour: true
                    }
                },
                defaultDate: new tempusDominus.DateTime(data.datetimeStart),
                viewDate: new tempusDominus.DateTime(data.datetimeStart),
            }, true);

            linked2.updateOptions({
                display: {
                    components: {
                        useTwentyfourHour: true
                    }
                },
                defaultDate: (new tempusDominus.DateTime(data.datetimeEnd)),
                viewDate: (new tempusDominus.DateTime(data.datetimeEnd)),
            }, true);

            linked1.dates.setValue(new tempusDominus.DateTime(data.datetimeStart))
            linked2.dates.setValue(new tempusDominus.DateTime(data.datetimeEnd))

            $('#btnSubmit').attr('onclick', `modifyReservSubmit('${reservationId}')`)

            // show modal
            $('#exampleModal').modal('show')
        })
        .catch(error => console.error(error))
}

// modify reservation submit
async function modifyReservSubmit(reservationId) {
    $('#btnSubmit').prop("disabled", true)
    $('#btnSubmit').text("Invio ...")
    $("#message-modal").attr('hidden')

    // convert the date to the right format
    function convertToISO(date) {
        splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
        splitDate[0] = splitDate[0].split("-")
        date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
        return date + ":00+02:00"
    }

    // check if the form is valid
    if (!$('form')[0].checkValidity()) {
        $("#message-modal").removeAttr('hidden')
        $("#message-modal").text("Per favore inserire tutti i dati")
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Invia")
        return
    }

    let d1 = $("#linkedPickers1Input").val()
    let d2 = $("#linkedPickers2Input").val()

    d1 = convertToISO(d1)
    d2 = convertToISO(d2)

    try {
        // fetch the insertion from the database
        const res = await fetch(`../api/v1/reservations/${reservationId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                datetimeStart: d1,
                datetimeEnd: d2,
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
            $(':input','form')
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
            // and reload the reservations
            // empty container
            $('#reservList').empty()
            await loadPrenotazioni()
        }
    } catch (err) {
        // if the reservation is not modified, show the error message
        $("#message-modal").text(err.message)
        $("#message-modal").removeAttr('hidden')
        $('#btnSubmit').prop("disabled", false)
        $('#btnSubmit').text("Invia")
    }
}

async function removeReserv(param) {
    //chiamata per eliminare la reservation
     if(confirm('Vuoi veramente eliminare questa prenotazione?\nL\'operazione non può essere annullata.'))
     {
        try {
            const res = await fetch(`/api/v1/reservations/${param}`, {
                method: "DELETE",
            });
            data = await res.json();

            if (!res.ok) throw data;
            //refresh
            $("#reservList").empty()
            await loadPrenotazioni()
        } catch (err) {
            console.log(err)
            alert(err.message)
        }
    }
}

async function load() {
    await loadData()
    await loadPrenotazioni()
}

load()