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
    return date + ":00+02:00";
}

function toggleAdvanced() {
    $(".advance-search").slideToggle("normal");
}

// call searchParkings function when the page is loaded
$(document).ready(function () {
    searchParkings();
    if (localStorage.getItem("query") != null) {
        // repopulate the search bar with the last query
        query = localStorage.getItem("query")
        query = query.substring(query.indexOf("?") + 1)
        // console.log(query)
        if (query != null) {
            // if minPrice or maxPrice or dateMin or dateMax are not null check advanced-toggle checkbox and hidden div
            if (query.includes("priceMin") || query.includes("priceMax") || query.includes("dateMin") || query.includes("dateMax")) {
                $("#advanced-toggle").prop("checked", true)
                $(".advance-search").css("display", "block")
            }
            query = query.split("&")
            // console.log(query)
            for (i = 0; i < query.length; i++) {
                query[i] = query[i].split("=")
                if (query[i][0] == "search") {
                    $('#search').val(query[i][1])
                } else if (query[i][0] == "priceMin") {
                    $('#minPrice').val(query[i][1])
                } else if (query[i][0] == "priceMax") {
                    $('#maxPrice').val(query[i][1])
                } else if (query[i][0] == "dateMin") {
                    var date = new Date(query[i][1].replace("%2B", "+"))
                    date.setHours(date.getHours())
                    var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
                    var month = date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
                    var year = date.getFullYear() < 10 ? '0' + date.getFullYear() : date.getFullYear()
                    var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
                    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
                    $('#linkedPickers1Input').val(`${day}/${month}/${year}, ${hours}:${minutes}`)
                } else if (query[i][0] == "dateMax") {
                    var date = new Date(query[i][1].replace("%2B", "+"))
                    date.setHours(date.getHours())
                    var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
                    var month = date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
                    var year = date.getFullYear() < 10 ? '0' + date.getFullYear() : date.getFullYear()
                    var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
                    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
                    $('#linkedPickers2Input').val(`${day}/${month}/${year}, ${hours}:${minutes}`)
                }
            }
        }
    }
});

async function searchParkings() {
    let query = `/api/v1/parkings?`

    //check value of rating field
    let rating = 0
    for (let i = 5; i > 0; i--) {
        if ($(`#${i}`).prop("checked")) {
            rating = i
            break
        }
    }

    const searchKey = $('#search').val()
    const minPrice = $('#minPrice').val()
    const maxPrice = $('#maxPrice').val()

    // console.log("min", minPrice)
    // console.log("max", maxPrice)

    let minDate = $("#linkedPickers1Input").val()
    if (minDate != "") {
        minDate = convertToISO(minDate).replace("+", "%2B")
    }
    let maxDate = $("#linkedPickers2Input").val()
    if (maxDate != "") {
        maxDate = convertToISO(maxDate).replace("+", "%2B")
    }

    // console.log(localStorage.getItem("query"))

    if (minDate == "" && maxDate == "" && searchKey == "" && minPrice == "" && maxPrice == "" && localStorage.getItem("query") == null) {

        let rating = 0
        for (let i = 5; i > 0; i--) {
            if ($(`#${i}`).prop("checked")) {
                rating = i
                break
            }
        }
        if (rating != 0) { console.log(`voto minimo ${rating}`); getAllParkings(true) }
        return
    }

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

        // save query to local storage
        localStorage.setItem("query", query)

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
                /* const res = await fetch(data[parking].self + "/reviews", {
                    method: "GET",
                })
                reviews = await res.json() */

                if (data[parking].averageStars != null && data[parking].averageStars >= rating) {
                    const fullStar = '<i class="fa-solid fa-star mr-2" style="color: #ffc107"></i>'
                    const avg = Math.round(data[parking].averageStars * 10) / 10
                    $(tmpParkHTML.find("span")[0]).html("&nbsp;" + avg + "&nbsp;" + fullStar + "&nbsp;(" + data[parking].reviews.length + ")")
                }
                if (rating !== 0 && (data[parking].averageStars == null || data[parking].averageStars < rating)) {
                    continue;
                }


                tmpParkHTML.removeAttr("hidden")
                $(tmpParkHTML.find("p")[0]).text(data[parking].name)
                $(tmpParkHTML.find("p")[2]).text(data[parking].address + " " + data[parking].city + " " + data[parking].country)
                $(tmpParkHTML.find("p")[3]).text(data[parking].self)
                $(tmpParkHTML.find("button")[0]).attr("onclick", `detailParking('${data[parking]._id}')`)
                $(tmpParkHTML.find("img")[0]).attr("src", data[parking].image)

                container.append(tmpParkHTML)
            }
        } else {
            $('#noParks').removeAttr("hidden")
        }
    } catch (err) {
        $("#message").removeAttr('hidden');
        $('#noParks').removeAttr("hidden")
    }
}

// add event listener to the button
$("#btnSearch").on("click", searchParkings)

async function getAllParkings(checkStelle, rating) {
    try {
        const res = await fetch("/api/v1/parkings", {
            method: "GET",
        })
        data = await res.json()

        let rating = 0
        for (let i = 5; i > 0; i--) {
            if ($(`#${i}`).prop("checked")) {
                rating = i
                break
            }
        }

        if (!res.ok)
            throw data
        if (data && data.length > 0) {
            $('#noParks').attr("hidden", true)
            const container = $('#parkContainer')
            const parkingHTML = $('#firstPark')
            container.empty()
            for (parking in data) {
                console.log(parking)
                //console.log(data[parking])
                tmpParkHTML = parkingHTML.clone()
                tmpParkHTML.removeAttr("hidden")
                /* const res2 = await fetch(data[parking].self + "/reviews", {
                    method: "GET",
                })
                reviews = await res2.json() */

                console.log(data[parking].averageStars)

                if (data[parking].averageStars != null && (!checkStelle || data[parking].averageStars >= rating)) {
                    //console.log("stelline")
                    const fullStar = '<i class="fa-solid fa-star mr-2" style="color: #ffc107"></i>'
                    const avg = Math.round(data[parking].averageStars * 10) / 10
                    $(tmpParkHTML.find("span")[0]).html("&nbsp;" + avg + "&nbsp;" + fullStar + "&nbsp;(" + data[parking].reviews.length + ")")
                }
                if ((data[parking].averageStars != null && data[parking].averageStars < rating && checkStelle) || (checkStelle && !data[parking].averageStars)) {
                    //console.log("continue")
                    continue;
                }

                $(tmpParkHTML.find("p")[0]).text(data[parking].name)
                $(tmpParkHTML.find("p")[2]).text(data[parking].address + " " + data[parking].city + " " + data[parking].country)
                $(tmpParkHTML.find("p")[3]).text(data[parking].self)
                $(tmpParkHTML.find("button")[0]).attr("onclick", `detailParking('${data[parking]._id}')`)
                $(tmpParkHTML.find("img")[0]).attr("src", data[parking].image)

                container.append(tmpParkHTML)
            }
        }
        else {
            $('#noParks').removeAttr("hidden")
        }
    } catch (err) {
        console.log(err)
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        $('#noParks').removeAttr("hidden")
        //alert(err.message);
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
    if (key == 13)  // the enter key code
        $('#btnSearch').click();
});

$('form').on('reset', function (event) {
    const state = $('#advanced-toggle').prop("checked")
    setTimeout(async function () {
        // executes after the form has been reset
        $('#advanced-toggle').prop("checked", state)
        await getAllParkings(false)
    }, 1);
    // delete query from local storage
    localStorage.removeItem("query")
});


getAllParkings(false)
$('#advanced-toggle').prop("checked", false)