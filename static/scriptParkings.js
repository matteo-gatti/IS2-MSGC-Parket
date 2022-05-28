function convertToISO(date) {
    splitDate = date.replace(", ", "T").replaceAll("/", "-").split("T");
    splitDate[0] = splitDate[0].split("-");
    date =
        splitDate[0][2] +
        "-" +
        splitDate[0][1] +
        "-" +
        splitDate[0][0] +
        "T" +
        splitDate[1];
    return date + ":00+01:00";
}

function toggleAdvanced() {
    $(".advance-search").slideToggle("normal"); 
}

async function searchParkings() {
    const searchKey = $('#search').val()
    const minPrice = $('#minPrice').val()
    const maxPrice = $('#maxPrice').val()

    console.log("min", minPrice)
    console.log("max", maxPrice)
    
    let minDate = $("#linkedPickers1Input").val()
    if(minDate != "") {
        minDate = convertToISO(minDate).replace("+", "%2B")
    }
    let maxDate = $("#linkedPickers2Input").val()
    if(maxDate != "") {
        maxDate = convertToISO(maxDate).replace("+", "%2B")
    }

    if (minDate == "" && maxDate == "" && searchKey == "" && minPrice == "" && maxPrice == "") 
        return
    
    let query = `/api/v1/parkings?`
    try {   
        //check if search key is empty
        if (searchKey != "") {
            query += `search=${searchKey}&`
        }
        //check if dates are not null
        if (minDate != "") {
            query += `dateMin=${minDate}&`
        }
        if (maxDate != "") {
            query += `dateMax=${maxDate}&`
        }
        //check if prices are not null
        if (minPrice != "") {
            query += `priceMin=${minPrice}&`
        }
        if (maxPrice != "") {
            query += `priceMax=${maxPrice}&`
        }
        // fetch the user from the database
        const res = await fetch(query, {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data
        const container = $('#parkContainer')
        container.empty()
        if (data && data.length > 0) {
            $('#noParks').attr("hidden", true)
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
        } else {
            $('#noParks').removeAttr("hidden")
        }
    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        $('#noParks').removeAttr("hidden")
    }   
}

// add event listener to the button
$("#btnSearch").on("click",searchParkings)

async function getAllParkings() {
    try {
        
        // fetch the user from the database
        const res = await fetch("/api/v1/parkings", {
            method: "GET",
        })
        data = await res.json()

        if (!res.ok)
            throw data
        if (data && data.length > 0) {
            $('#noParks').attr("hidden", true)
            const container = $('#parkContainer')
            const parkingHTML = $('#firstPark')
            container.empty()
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
        }
        else {
            $('#noParks').removeAttr("hidden")
        }
    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        $('#noParks').removeAttr("hidden")
        //alert("Wrong email or password");
    }
}
function newParking() {
    window.location.href = "/createParking"
}

function detailParking(id) {
    window.location.href = "/detailParking?id=" + id
    
}

tempusDominus.loadLocale(tempusDominus.locales.it);

//globally
tempusDominus.locale(tempusDominus.locales.it.name);
// date time

//--------------------------------- period datepickers ---------------------------------------
const linkedPicker1Element = document.getElementById("linkedPickers1");
const linkedPicker2Element = document.getElementById("linkedPickers2");
const linked1 = new tempusDominus.TempusDominus(linkedPicker1Element);
const linked2 = new tempusDominus.TempusDominus(linkedPicker2Element);

const now = new tempusDominus.DateTime().startOf("minutes")

linked1.updateOptions({
    defaultDate: now,
    restrictions: {
        minDate: now,
    },
    display: {
        components: {
            useTwentyfourHour: true,
        },
    },
});

linked2.updateOptions({
    defaultDate: now,
    restrictions: {
        minDate: now,
    },
    display: {
        components: {
            useTwentyfourHour: true,
        },
    },
});

linkedPicker1Element.addEventListener(tempusDominus.Namespace.events.change, (e) => {
    linked2.updateOptions({
        defaultDate: e.detail.date,
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

linkedPicker2Element.addEventListener(tempusDominus.Namespace.events.change, (e) => {
    linked1.updateOptions({
        defaultDate: new tempusDominus.DateTime().startOf("minutes"),
        restrictions: {
            minDate: new tempusDominus.DateTime().startOf("minutes"),
            maxDate: e.detail.date
        },
        display: {
            components: {
                useTwentyfourHour: true
            }
        }
    });
});

$('form input').keypress(function (e) {
    var key = e.which;
    if(key == 13)  // the enter key code
       $('#btnSearch').click();
});   

$('form').on('reset', function (event) {
    const state = $('#advanced-toggle').prop("checked")
    setTimeout(async function() {
        // executes after the form has been reset
        $('#advanced-toggle').prop("checked", state)
        await getAllParkings()
      }, 1);
    
});


getAllParkings()
$('#advanced-toggle').prop("checked", false)