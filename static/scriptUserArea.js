function goBack() {
    history.back()
}

async function loadData()
{
    try {
        var id  = $('#usrId').text()
        
        const res = await fetch(`/api/v1/users/${id}`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        
        if (data) {
            $("#username").text(data.username)
            $("#userEmail").text(data.email)
            $("#userNameSurname").text(data.name + " " + data.surname)
        }
    }
    catch (err) {
        
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
    
    let container = $("#reservList")
    for(i in data)
    {
        data[i].datetimeStart = (new Date(data[i].datetimeStart)).toLocaleString("it-IT").slice(0, -3)
        data[i].datetimeEnd = (new Date(data[i].datetimeEnd)).toLocaleString("it-IT").slice(0, -3)
        tmpHTML = "<div class=\"col-sm-4 mb-3\">" + 
        "<p class=\"m-b-10 f-w-600\">" + "<a style='text-decoration:none' href=insertion?insertion="+ data[i].insertion._id + ">" + data[i].insertion.name + "</a> - " + 
        "<a style='text-decoration:none' href=detailParking?id="+ data[i].insertion.parking._id + ">" + data[i].insertion.parking.name + "</a></p>" +
        "<h6 class=\"d-inline\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Da: </h6><span class='text-muted' style='font-size: 14px;'>" + data[i].datetimeStart + "</span>" +
        "<br><h6 class='d-inline'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A: </h6><span class='text-muted' style='font-size: 14px;'>" + data[i].datetimeEnd + "</span>" + 
        "<br><h6 class='d-inline'>Costo: </h6><span class='text-muted' style='font-size: 14px;'>" + data[i].price.toLocaleString('it-IT', 
        {
            style: 'currency',
            currency: 'EUR',
        }) + "</span>" + 
        "</div>"
        container.append(tmpHTML)
    }
}

async function load()
{
    await loadData()
    await loadPrenotazioni()
}
load()