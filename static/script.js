/**
 * This function is called when register button is clicked
 */
function register() {
    var name = $('#name').val();
    var surname = $('#surname').val();
    var email = $('#email').val();
    var username = $('#username').val();
    var password = $('#password').val();

    fetch('../api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify( { name: name, surname: surname, email: email, username: username, password: password} )
    })
    .catch( error => console.error(error) )
}