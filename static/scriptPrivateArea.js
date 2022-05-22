async function getMyParkings() {
    // get the values from the form
    //const identifier = $("#identifier").val()
    //const password = $("#password").val()
    console.log("getting parkings")
    try {
        // fetch the user from the database
        const res = await fetch("/api/v1/parkings/myParkings", {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        console.log("data", data)
        if (data) {
            //console.log(data)
            const container = $('#parkContainer')
            const parkingHTML = $('#firstPark')
            for (parking in data.parkings) {
                tmpParkHTML = parkingHTML.clone()
                tmpParkHTML.removeAttr("hidden")
                $(tmpParkHTML.find("p")[0]).text(data.parkings[parking].name)
                $(tmpParkHTML.find("p")[2]).text(data.parkings[parking].address + " " + data.parkings[parking].city + " " + data.parkings[parking].country)
                $(tmpParkHTML.find("p")[3]).text(data.parkings[parking].self)
                $(tmpParkHTML.find("button")[0]).attr("onclick",`detailParking('${data.parkings[parking]._id}')`)
                $(tmpParkHTML.find("img")[0]).attr("src", data.parkings[parking].image)
                container.append(tmpParkHTML)

            }
            if (data.parkings.length === 0) {
                $('#noParks').removeAttr("hidden")
            }
        }

    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        //alert("Wrong email or password");
    }
}
function newParking() {
    window.location.href = "/createParking"
}
getMyParkings()

function detailParking(id) {
    window.location.href = "/detailParking?id=" + id
    console.log(window.location.href)
}

function newParkingFromInsertion()
{
    window.location.href = "/createParkingInsertion"
}

async function loadData()
{
    // '/api/v1/users/userId'
    console.log("getting user info")
    try {
        // fetch the user from the database
        var id  = $('#usrId').text()
        console.log(`/api/v1/users/${id}`)
        const res = await fetch(`/api/v1/users/${id}`, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        console.log("data", data)
        if (data) {
            $("#username").text(data.username)
            $("#userEmail").text(data.email)
            $("#userNameSurname").text(data.name + " " + data.surname)
        }
    }
    catch (err) {
        console.log(err)
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