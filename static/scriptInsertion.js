function goBack() {
    //window.location.href = "/privateArea"
    history.back()
}

async function loadInfo()
{
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("insertion")) {
            throw { message: "insertion not in URL!" }
        }else
        {
            //$("#insertionId").text(`Inserzione ${urlParams.get("insertion")}`)

            const res = await fetch(`/api/v1/insertions/${urlParams.get('insertion')}`, {
                method: "GET",
            })
            data = await res.json()
    
            if (!res.ok)
                throw data
    
            console.log("data", data)

            $("h5:eq(0)").text(data.name)
            $("h5:eq(1)").text(data.datetimeStart)
            $("h5:eq(2)").text(data.datetimeEnd)
            $("h5:eq(3)").text(data.minInterval + " minuti")
            $("h5:eq(4)").text(data.priceHourly + " EUR/hr.")
            $("h5:eq(5)").text(data.priceDaily+ " EUR/gg")
            $("h5:eq(6)").text(data.recurrent)

            let container = $("#prenotazContainer")
            for(i in data.reservations)
            {
                tmpHTML = $(".prenotazList").clone()
                tmpHTML.removeAttr("hidden")
                tmpHTML.removeClass("prenotazList")
                $(tmpHTML).html("da: " + data.reservations[i].datetimeStart + "  a: " + data.reservations[i].datetimeEnd + "da parte di: "+data.reservations[i].client._id)
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

}

main()