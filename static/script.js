// This function is called when register button is clicked
async function register(e) {
    // get the values from the form
    e.preventDefault()
    var name = $("#name").val();
    var surname = $("#surname").val();
    var email = $("#email").val();
    var username = $("#username").val();
    var password = $("#password").val();

    try {
        let emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
        if (!emailPattern.test(email)) {
            throw { message: "Email is not valid" }
        }

        const res = await fetch("../api/v2/users", {
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

    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}

// This function is called when login button is clicked
async function login(e) {
    e.preventDefault()
    // get the values from the form
    const identifier = $("#identifier").val()
    const password = $("#password").val()
    try {
        // fetch the user from the database
        const res = await fetch("../api/v2/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: identifier, password: password }),
        })
        data = await res.json()

        if (!res.ok)
            throw data

        if (data.token) {
            // save jwt token to cookie
            document.cookie = "token=" + data.token
            window.location.href = document.referrer
        }
    } catch (err) {
        $("#message").text(err.message)
        $("#message").removeAttr('hidden');
    }
}

$("#login").submit(login)
$("#register").submit(register)

// This function is called when logout button is clicked
async function logout() {
    // remove jwt token
    const res = await fetch("/api/v2/auth/logout", {
        method: "POST"
    })
    data = await res.json()
    if (data.token) {
        // save jwt token to cookie
        document.cookie = "token=" + data.token
        window.location.href = "/"
    }
}