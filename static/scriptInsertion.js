function goBack() {
    history.back();
}

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

function cleanseList() {
    $("#prenotazContainer").empty();
    $("#message").text("");
}

async function loadInfo() {
    cleanseList();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("insertion")) {
            throw { message: "insertion not in URL!" };
        } else {
            const res = await fetch(
                `/api/v1/insertions/${urlParams.get("insertion")}`,
                {
                    method: "GET",
                }
            );
            data = await res.json();

            if (!res.ok) throw data;

            $("#insertionName").text(data.name);
            $("#insertionFrom").text(
                new Date(data.datetimeStart)
                    .toLocaleString("it-IT")
                    .slice(0, -3)
            );
            $("#insertionTo").text(
                new Date(data.datetimeEnd).toLocaleString("it-IT").slice(0, -3)
            );
            $("#insertionInterval").text(data.minInterval + " minuti");
            $("#insertionPriceH").text(
                data.priceHourly.toLocaleString("it-IT", {
                    style: "currency",
                    currency: "EUR",
                }) + "/ora."
            );
            let priceD = "Non disponibile";
            if (data.priceDaily != null) {
                priceD =
                    data.priceDaily.toLocaleString("it-IT", {
                        style: "currency",
                        currency: "EUR",
                    }) + "/giorno";
            }
            $("#insertionPriceD").text(priceD);
            if (data.recurrent === true) {
                const daysDict = {
                    monday: "Lunedì",
                    tuesday: "Martedì",
                    wednesday: "Mercoledì",
                    thursday: "Giovedì",
                    friday: "Venerdì",
                    saturday: "Sabato",
                    sunday: "Domenica",
                };
                $("#recurrenceContainer").attr("hidden", false);
                let dayString = "";
                data.recurrenceData.daysOfTheWeek.forEach((day) => {
                    dayString += daysDict[day] + ", ";
                });
                dayString = dayString.slice(0, -2);
                $("#insertionRecurrentDays").text(dayString);
                let intervalFrom = new Date(data.recurrenceData.timeStart)
                    .toLocaleTimeString("it-IT")
                    .slice(0, -3);
                let intervalTo = new Date(data.recurrenceData.timeEnd)
                    .toLocaleTimeString("it-IT")
                    .slice(0, -3);
                $("#insertionRecurrentHours").text(
                    intervalFrom + " - " + intervalTo
                );
            }

            $("#imgParking").attr("src", data.parking.image);
            $("#nameParking").text(data.parking.name);
            $("#addressParking").html(
                data.parking.address +
                    ", " +
                    data.parking.city +
                    "<br>" +
                    data.parking.country
            );

            let container = $("#reservList");
            container.empty();
            for (i in data.reservations) {
                tmpHTML = $("#reservTemplate").clone();
                tmpHTML.removeAttr("hidden");
                data.reservations[i].datetimeStart = new Date(
                    data.reservations[i].datetimeStart
                )
                    .toLocaleString("it-IT")
                    .slice(0, -3);
                data.reservations[i].datetimeEnd = new Date(
                    data.reservations[i].datetimeEnd
                )
                    .toLocaleString("it-IT")
                    .slice(0, -3);

                $(tmpHTML)
                    .find("#reservationClient")
                    .text(data.reservations[i].client.username);
                $(tmpHTML)
                    .find("#reservationFrom")
                    .text(data.reservations[i].datetimeStart);
                $(tmpHTML)
                    .find("#reservationTo")
                    .text(data.reservations[i].datetimeEnd);

                container.append(tmpHTML);
            }
        }
    } catch (err) {}
}

async function main() {
    await loadInfo();

    tempusDominus.loadLocale(tempusDominus.locales.it);

    //globally
    tempusDominus.locale(tempusDominus.locales.it.name);
    // date time

    //--------------------------------- period datepickers ---------------------------------------
    const linkedPicker1Element = document.getElementById("linkedPickers1");
    const linkedPicker2Element = document.getElementById("linkedPickers2");
    const linked1 = new tempusDominus.TempusDominus(linkedPicker1Element);
    //linked1.locale(localization)

    let recurrent = false;
    let daysOfWeekDisabled = [];
    let enabledHours = [];
    if ($("#recurrenceContainer").attr("hidden") == null) {
        recurrent = true;
        let recDays = $("#insertionRecurrentDays").text().split(", ");
        const daysToID = {
            Lunedì: 1,
            Martedì: 2,
            Mercoledì: 3,
            Giovedì: 4,
            Venerdì: 5,
            Sabato: 6,
            Domenica: 0,
        };
        recDays = recDays.map((day) => daysToID[day]);
        let days = [0, 1, 2, 3, 4, 5, 6];
        days = days.filter((day) => {
            return !recDays.includes(day);
        });
        daysOfWeekDisabled = days;

        const recHours = $("#insertionRecurrentHours")
            .text()
            .split(" - ")
            .map((time) => {
                return time.slice(0, -3).replace(/^0/, "");
            });
        for (let i = parseInt(recHours[0]); i <= parseInt(recHours[1]); i++) {
            enabledHours.push(i);
        }
    }

    function convertDate(date) {
        let dateArray = $("#" + date)
            .text()
            .split("/");
        return (dateString =
            dateArray[1] + "/" + dateArray[0] + "/" + dateArray[2]);
    }

    let minDate = new tempusDominus.DateTime().startOf("minutes");
    if (
        minDate.isBefore(
            new tempusDominus.DateTime(convertDate("insertionFrom"))
        )
    ) {
        minDate = new tempusDominus.DateTime(convertDate("insertionFrom"));
    }
    if (recurrent === true) {
        let time = $("#insertionRecurrentHours")
            .text()
            .split(" - ")[0]
            .split(":");
        minDate.setHours(parseInt(time[0]), parseInt(time[1]));
        while (daysOfWeekDisabled.includes(minDate.getDay()))
            minDate.setDate(minDate.getDate() + 1);
    }

    let maxDate = new tempusDominus.DateTime(convertDate("insertionTo"));

    //Global options DA
    linked1.updateOptions({
        defaultDate: minDate,
        restrictions: {
            minDate: minDate,
            maxDate: maxDate,
            daysOfWeekDisabled: daysOfWeekDisabled,
            enabledHours: enabledHours,
        },
        display: {
            components: {
                useTwentyfourHour: true,
            },
        },
    });

    //Global options A
    const linked2 = new tempusDominus.TempusDominus(linkedPicker2Element, {
        defaultDate: minDate,
        restrictions: {
            minDate: minDate,
            maxDate: maxDate,
            daysOfWeekDisabled: daysOfWeekDisabled,
            enabledHours: enabledHours,
        },
        display: {
            components: {
                useTwentyfourHour: true,
            },
        },
    });

    //Opzioni di A quando cambia DA
    linked1.subscribe(tempusDominus.Namespace.events.change, (e) => {
        let eventDate = new tempusDominus.DateTime(e.date);
        let enabledDates = [];
        let recmaxDate = maxDate;
        if (recurrent === true) {
            enabledDates.push(eventDate);
            const time = $("#insertionRecurrentHours")
                .text()
                .split(" - ")[1]
                .split(":");
            recmaxDate = new tempusDominus.DateTime(eventDate);
            recmaxDate.setHours(parseInt(time[0]), parseInt(time[1]));
            if (recmaxDate.isAfter(maxDate)) {
                recmaxDate = maxDate;
            }
        }

        //
        try {
            linked2.updateOptions({
                defaultDate: eventDate,
                restrictions: {
                    minDate: eventDate,
                    maxDate: recmaxDate,
                    daysOfWeekDisabled: daysOfWeekDisabled,
                    enabledHours: enabledHours,
                    enabledDates: enabledDates,
                },
                display: {
                    components: {
                        useTwentyfourHour: true,
                    },
                },
            });
        } catch (err) {
            linked2.updateOptions({
                defaultDate: minDate,
                restrictions: {
                    minDate: minDate,
                    maxDate: maxDate,
                    daysOfWeekDisabled: daysOfWeekDisabled,
                    enabledHours: enabledHours,
                    enabledDates: enabledDates,
                },
                display: {
                    components: {
                        useTwentyfourHour: true,
                    },
                },
            });
        }
    });

    /* linked2.subscribe(tempusDominus.Namespace.events.change, (e) => {
        
        

        const spasticMinDate = new tempusDominus.DateTime(minDate);
        spasticMinDate.setDate(spasticMinDate.getDate()-1);

        

        let newminDate = new tempusDominus.DateTime().startOf("minutes");
        if(newminDate.isBefore(new tempusDominus.DateTime(convertDate("insertionFrom")))) {
            newminDate = new tempusDominus.DateTime(convertDate("insertionFrom"));
        }

        linked1.updateOptions({
            defaultDate: newminDate,
            restrictions: {
                minDate: newminDate,
                maxDate: e.date,
                daysOfWeekDisabled: daysOfWeekDisabled,
                enabledHours: enabledHours
            },
            display: {
                components: {
                    useTwentyfourHour: true
                }
            }
        });
      }); */

    // !BROKEN
    /* //Opzioni di DA quando cambia A
    linkedPicker2Element.addEventListener(tempusDominus.Namespace.events.change, function (e) {
        
        

        const spasticMinDate = new tempusDominus.DateTime(minDate);
        spasticMinDate.setDate(spasticMinDate.getDate()-1);

        

        let newminDate = new tempusDominus.DateTime().startOf("minutes");
        if(newminDate.isBefore(new tempusDominus.DateTime(convertDate("insertionFrom")))) {
            newminDate = new tempusDominus.DateTime(convertDate("insertionFrom"));
        }

        linked1.updateOptions({
            defaultDate: newminDate,
            restrictions: {
                minDate: newminDate,
                maxDate: e.detail.date,
                daysOfWeekDisabled: daysOfWeekDisabled,
                enabledHours: enabledHours
            },
            display: {
                components: {
                    useTwentyfourHour: true
                }
            }
        });
    }); */
    //--------------------------------- end period datepickers ------------------------------------
}

async function createReservation() {
    let d1 = $("#linkedPickers1Input").val();
    let d2 = $("#linkedPickers2Input").val();

    d1 = convertToISO(d1);
    d2 = convertToISO(d2);

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const res = await fetch(
            `../api/v1/insertions/${urlParams.get("insertion")}/reservations`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    datetimeStart: d1,
                    datetimeEnd: d2,
                }),
            }
        );

        // data = await res.json()
        if (!res.ok) {
            throw await res.json();
        } else {
            cleanseList();
            await loadInfo();
        }
    } catch (err) {
        $("#message").text(err.message);
        $("#message").removeAttr("hidden");
    }
}
main();
