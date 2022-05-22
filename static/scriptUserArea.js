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
        $("h5:eq(2)").text(data.parkings.length)
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
    //bisogna trovare il modo di visualizzare le prenotazioni dell'utente, attualmente non credo ci sia un fetch pronto per farlo
    //le prenotazioni non mi sembrano legate all'utente, forse conviene legarle con un id?
    //per debug l'utente a - a (62877165b165a66c75ad933e) ha due prenotazioni a suo nome
    //@eric @merlo
}

async function load()
{
    await loadData()
    await loadPrenotazioni()
}
load()