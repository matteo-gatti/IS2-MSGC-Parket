async function createInsertion() {

    function convertToISO(date) {
        splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
        splitDate[0] = splitDate[0].split("-")
        date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
        return date + ":00+01:00"
    }

    console.log("Creazione inserzione")
    const id = $("#parkId").text()
    const name = $("#insertion-name").val()
    let d1 = $("#linkedPickers1Input").val()
    let d2 = $("#linkedPickers2Input").val()

    d1 = convertToISO(d1)
    d2 = convertToISO(d2)
    try {
        const res = await fetch(`../api/v1/parkings/${id}/insertions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                reservations: [
                    {
                        "datetimeStart": d1,
                        "datetimeEnd": d2
                    }
                ]
            }),
        })
        console.log(res)
        //const data = await res.json()
        if (!res.ok) {
            throw await res.json()
        } else {
            $('#close-modal').click()
            await getMyInsertions()
        }

        //if()
        //  console.log("ciao mamma")
    } catch (err) {
        console.log("ERROR", err)
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
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
            $("#lblVisible").text(data.visible ? "Sì" : "No")
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
    window.location.href = "/privateArea"
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
    useCurrent: false
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
        }
    });
});

async function main() {
    await loadDetails()
    await getMyInsertions()
}
main()