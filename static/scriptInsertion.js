
function goBack() {
    //window.location.href = "/privateArea"
    history.back()
}

function convertToISO(date) {
    splitDate = (date.replace(", ", "T").replaceAll("/", "-").split("T"))
    splitDate[0] = splitDate[0].split("-")
    date = splitDate[0][2] + "-" + splitDate[0][1] + "-" + splitDate[0][0] + "T" + splitDate[1]
    return date + ":00+01:00"
}

function cleanseList()
{
    $('#prenotazContainer').empty();
    $('#message').text("");
}

async function loadInfo()
{
    cleanseList()
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("insertion")) {
            throw { message: "insertion not in URL!" }

        } else{
            //$("#insertionId").text(`Inserzione ${urlParams.get("insertion")}`)

            const res = await fetch(`/api/v1/insertions/${urlParams.get('insertion')}`, {
                method: "GET",
            })
            data = await res.json()
    
            if (!res.ok)
                throw data
    
            console.log("data", data)

            $("#insertionName").text(data.name)
            $("#insertionFrom").text(((new Date(data.datetimeStart)).toLocaleString("it-IT")).slice(0, -3))
            $("#insertionTo").text(((new Date(data.datetimeEnd)).toLocaleString("it-IT")).slice(0, -3))
            $("#insertionInterval").text(data.minInterval + " minuti")
            $("#insertionPriceH").text(data.priceHourly.toLocaleString('it-IT', 
            {
                style: 'currency',
                currency: 'EUR',
            }) + "/ora.")
            let priceD = "Non disponibile"
            if(data.priceDaily != null) {
                priceD = data.priceDaily.toLocaleString('it-IT', 
                {
                    style: 'currency',
                    currency: 'EUR',
                }) + "/giorno"
            }
            $("#insertionPriceD").text(priceD)
            if (data.recurrent === true) {
                const daysDict = { "monday": "Lunedì", "tuesday": "Martedì","wednesday": "Mercoledì","thursday": "Giovedì","friday": "Venerdì","saturday": "Sabato","sunday": "Domenica",}
                $("#recurrenceContainer").attr("hidden", false)
                let dayString = ""
                data.recurrenceData.daysOfTheWeek.forEach((day) => {
                    dayString += daysDict[day] + ", "
                })
                dayString = dayString.slice(0, -2)
                $("#insertionRecurrentDays").text(dayString)
                let intervalFrom = (new Date(data.recurrenceData.timeStart)).toLocaleTimeString("it-IT").slice(0, -3)
                let intervalTo = (new Date(data.recurrenceData.timeEnd)).toLocaleTimeString("it-IT").slice(0, -3)
                $("#insertionRecurrentHours").text(intervalFrom + " - " + intervalTo)
            }

            $("#imgParking").attr("src", data.parking.image)
            $("#nameParking").text(data.parking.name)
            $("#addressParking").html(data.parking.address + ", " + data.parking.city + "<br>" + data.parking.country)

            let container = $("#reservList")
            container.empty()
            for(i in data.reservations)
            {
                tmpHTML = $("#reservTemplate").clone()
                tmpHTML.removeAttr("hidden")
                data.reservations[i].datetimeStart = (new Date(data.reservations[i].datetimeStart)).toLocaleString("it-IT").slice(0, -3)
                data.reservations[i].datetimeEnd = (new Date(data.reservations[i].datetimeEnd)).toLocaleString("it-IT").slice(0, -3)
                
                $(tmpHTML).find("#reservationClient").text(data.reservations[i].client.username)
                $(tmpHTML).find("#reservationFrom").text(data.reservations[i].datetimeStart)
                $(tmpHTML).find("#reservationTo").text(data.reservations[i].datetimeEnd)
  
                container.append(tmpHTML)
            }
        }
    }
    catch(err)
    {
        console.log(err.message)
    }
}


async function main()
{
    await loadInfo()

    tempusDominus.loadLocale(tempusDominus.locales.it);

    //globally
    tempusDominus.locale(tempusDominus.locales.it.name);
    // date time

    //--------------------------------- period datepickers ---------------------------------------
    const linkedPicker1Element = document.getElementById('linkedPickers1');
    const linked1 = new tempusDominus.TempusDominus(linkedPicker1Element);
    //linked1.locale(localization)

    linked1.updateOptions({
        restrictions: {
            minDate: new tempusDominus.DateTime().startOf("minutes"),
            maxDate: new tempusDominus.DateTime(($("h5:eq(2)")).text())
        },
        display: {
            components: {
                useTwentyfourHour: true
            }
        }
    })

    const linked2 = new tempusDominus.TempusDominus(document.getElementById('linkedPickers2'), {
        useCurrent: false,
        restrictions: {
            minDate: new tempusDominus.DateTime().startOf("minutes"),
            maxDate: new tempusDominus.DateTime(($("h5:eq(2)")).text())
        },
        display: {
            components: {
                useTwentyfourHour: true
            }
        }
    });

    //using event listeners
    linkedPicker1Element.addEventListener(tempusDominus.Namespace.events.change, (e) => {
        linked2.updateOptions({
            restrictions: {
                minDate: e.detail.date,
                maxDate: new tempusDominus.DateTime(($("h5:eq(2)")).text())
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
                minDate: new tempusDominus.DateTime().startOf("minutes"),
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
}


async function createReservation()
{
    let d1 = $("#linkedPickers1Input").val()
    let d2 = $("#linkedPickers2Input").val()

    d1 = convertToISO(d1)
    d2 = convertToISO(d2)

    console.log(d1)
    console.log(d2)

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const res = await fetch(`../api/v1/insertions/${urlParams.get('insertion')}/reservations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                datetimeStart: d1,
                datetimeEnd: d2,
            }),
        })
        console.log(res)
        // data = await res.json()
        if (!res.ok) {
            throw await res.json()
        } else {
            cleanseList()
            await loadInfo()

        }
    } catch (err) {
        console.log("ERROR", err)
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');

    }
}
main()