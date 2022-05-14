// This function is called when register button is clicked
async function register() {
    // get the values from the form
    var name = $("#name").val();
    var surname = $("#surname").val();
    var email = $("#email").val();
    var username = $("#username").val();
    var password = $("#password").val();
    try {
        await fetch("../api/v1/users", {
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
    } catch (err) {
        console.log(err)
    }
}

// This function is called when login button is clicked
async function login() {
    // get the values from the form
    var email = $("#email").val();
    var password = $("#password").val();

    // fetch the user from the database
    const res = await fetch("../api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
    })
    data = await res.json()
    try {
        //console.log(data)
        if (data.token) {
            // save jwt token to cookie
            document.cookie = "token=" + data.token
            window.location.href = "/"
        }
    } catch (err) {
        alert("Wrong email or password");
    }
}

// This function is called when logout button is clicked
async function logout() {
    // remove jwt token
    const res = await fetch("../api/v1/auth/logout", {
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