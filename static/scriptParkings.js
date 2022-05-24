
async function getAllParkings() {
    try {
        // fetch the user from the database
        const res = await fetch("/api/v1/parkings", {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data

        if (data) {
            const container = $('#parkContainer')
            const parkingHTML = $('#firstPark')
            for (parking in data) {
                tmpParkHTML = parkingHTML.clone()
                tmpParkHTML.removeAttr("hidden")
                $(tmpParkHTML.find("p")[0]).text(data[parking].name)
                $(tmpParkHTML.find("p")[2]).text(data[parking].address + " " + data[parking].city + " " + data[parking].country)
                $(tmpParkHTML.find("p")[3]).text(data[parking].self)
                $(tmpParkHTML.find("button")[0]).attr("onclick",`detailParking('${data[parking]._id}')`)
                $(tmpParkHTML.find("img")[0]).attr("src", data[parking].image)
                container.append(tmpParkHTML)

            }
            if (data.length === 0) {
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

function detailParking(id) {
    window.location.href = "/detailParking?id=" + id
    
}

getAllParkings()