
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

            $("h5:eq(0)").text(data.name)
            $("h5:eq(1)").text((new Date(data.datetimeStart)).toLocaleString("it-IT"))
            $("h5:eq(2)").text((new Date(data.datetimeEnd)).toLocaleString("it-IT"))
            $("h5:eq(3)").text(data.minInterval + " minuti")
            $("h5:eq(4)").text(data.priceHourly + " EUR/hr.")
            $("h5:eq(5)").text(data.priceDaily + " EUR/gg")
            $("h5:eq(6)").text(data.recurrent)

            if(data.recurrent)
            {
                let htmlRec = $(".recurrencyDiv")
                $(htmlRec).removeAttr('hidden')
                let daystxt = ""
                let days = data.recurrenceData.daysOfTheWeek
                for (i in days)
                {
                    daystxt += (data.recurrenceData.daysOfTheWeek[i]+", ")
                }
                daystxt = daystxt.slice(0,-2)

                $(htmlRec.find("h6")[0]).text(daystxt)

                let isoDate = data.recurrenceData.timeStart
                let result = isoDate.match(/\d\d:\d\d/);
               // $(htmlRec.find("h6")[1]).text(result[0])
                let isoDate2 = data.recurrenceData.timeEnd
                let result2 = isoDate2.match(/\d\d:\d\d/);
                $(htmlRec.find("h6")[1]).text(`${result[0]} - ${result2[0]}`)

            }

            let container = $("#prenotazContainer")
            for(i in data.reservations)
            {
                tmpHTML = $(".prenotazList").clone()
                tmpHTML.removeAttr("hidden")
                tmpHTML.removeClass("prenotazList")
                data.reservations[i].datetimeStart = (new Date(data.reservations[i].datetimeStart)).toLocaleString("it-IT")
                data.reservations[i].datetimeEnd = (new Date(data.reservations[i].datetimeEnd)).toLocaleString("it-IT")
                $(tmpHTML).html("Da: " + data.reservations[i].datetimeStart + "<br>A: " + data.reservations[i].datetimeEnd + "<br>Da parte di: "+data.reservations[i].client.username)
                container.append(tmpHTML)
            }
            container.append("</ul>")
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