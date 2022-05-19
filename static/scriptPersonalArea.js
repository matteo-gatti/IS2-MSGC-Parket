// This function is called when login button is clicked
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
                $(tmpParkHTML.find("p")[1]).text(data.parkings[parking].description)
                $(tmpParkHTML.find("p")[2]).text(data.parkings[parking].address + " " + data.parkings[parking].city + " " + data.parkings[parking].country)
                $(tmpParkHTML.find("p")[3]).text(data.parkings[parking].self)
                console.log(data.parkings[parking].image)
                $(tmpParkHTML.find("img")[0]).attr("src", data.parkings[parking].image)
                container.append(tmpParkHTML)
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