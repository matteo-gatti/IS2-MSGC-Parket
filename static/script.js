// This function is called when register button is clicked
async function register() {
    // get the values from the form
    var name = $("#name").val();
    var surname = $("#surname").val();
    var email = $("#email").val();
    var username = $("#username").val();
    var password = $("#password").val();
    try {
        const res = await fetch("../api/v1/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                surname: surname,
                email: email,
                username: username,
                password: password,
            }),
        })

        if (!res.ok) {
            throw await res.json()
        } else {
            window.location.href = "/login"
        }

        //if()
          //  console.log("ciao mamma")
    } catch (err) {
        console.log("ERROR", err)
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}

// This function is called when login button is clicked
async function login() {
    // get the values from the form
    const identifier = $("#identifier").val()
    const password = $("#password").val()
    try {
        // fetch the user from the database
        const res = await fetch("../api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({identifier: identifier, password: password}),
        })
        data = await res.json()

        if (!res.ok)
            throw data
    
        //console.log(data)
        if (data.token) {
            // save jwt token to cookie
            document.cookie = "token=" + data.token
            window.location.href = "/"
        }
        console.log(data) 
    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
        //alert("Wrong email or password");
    }
}

// This function is called when logout button is clicked
async function logout() {
    // remove jwt token
    const res = await fetch("/api/v1/auth/logout", {
        method: "POST"
    })
    data = await res.json()
    console.log(data)
    if (data.token) {
        // save jwt token to cookie
        document.cookie = "token=" + data.token
        window.location.href = "/"
    }
}