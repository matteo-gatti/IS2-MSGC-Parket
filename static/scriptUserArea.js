function goBack() {
    //window.location.href = "/privateArea"
    history.back()
}

async function loadData()
{
    // '/api/v1/users/userId'
    console.log("getting user info")
    try {
        // fetch the user from the database
        var id  = $('#usrId').text()
        console.log(id)
        const res = await fetch(`/api/v1/users/${id}`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        console.log("data", data)
        if (data) {
        $("h5:eq(0)").text(data.username)
        $("h5:eq(1)").text(data.email)
        $("h5:eq(2)").html(data.parkings.length + " (<a href=privateArea>Mostra</a>)")
        $("h5:eq(3)").text(data.name)
        $("h5:eq(4)").text(data.surname)

        }
    }
    catch (err) {
        console.log("ERROREEEEEEEEEE")
    }
}

async function loadPrenotazioni()
{
    const res = await fetch(`/api/v1/reservations/myReservations`, {
        method: "GET",
    })
    data = await res.json()

    if (!res.ok)
        throw data
    
    console.log(data)
    
    let container = $("#prenotazContainer")
    for(i in data)
    {
        tmpHTML = $(".prenotazList").clone()
        tmpHTML.removeAttr("hidden")
        tmpHTML.removeClass("prenotazList")
        data[i].datetimeStart = (new Date(data[i].datetimeStart)).toLocaleString("it-IT")
        data[i].datetimeEnd = (new Date(data[i].datetimeEnd)).toLocaleString("it-IT")
        $(tmpHTML).html("Da: " + data[i].datetimeStart + "<br> A: " + data[i].datetimeEnd + "<br>Per l'inserzione: <a href=insertion?insertion="+ data[i].insertion._id + ">" + data[i].insertion.name + "</a>")
        container.append(tmpHTML)
    }
    container.append("</ul>")
}

async function load()
{
    await loadData()
    await loadPrenotazioni()
}
load()