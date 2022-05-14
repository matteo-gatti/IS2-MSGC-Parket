import jwt from 'jsonwebtoken'

// Check if the token is valid
const tokenChecker = (req, res, next) => {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['authorization'] || req.cookies.token
    // decode token
    if (!token) {
        // if there is no token
        res.status(401).send({ auth: false, message: 'No token provided.' })
    } else {
        // verifies secret and checks exp
        jwt.verify(token, process.env.SUPER_SECRET, (err, decoded) => {
            if (err) {
                res.status(500).send({ auth: false, message: 'Failed to authenticate token.' })
            } else {
                // if everything is good, save to request for use in other routes
                req.loggedInUser = decoded
                next()
            }
        })
    }
}

const tokenValid = (req, res, next) => {
    // check header or url parameters or post parameters for token
    console.log(req.cookies)
    var token = req.body.token || req.query.token || req.headers['authorization'] || req.cookies.token
    console.log("checking token if valid")
    if(token) {
        // verifies secret and checks exp
        jwt.verify(token, process.env.SUPER_SECRET, (err, decoded) => {
            if(!err) {
                // if everything is good, save to request for use in other routes
                req.loggedInUser = decoded
                console.log("token valid")
            }
        })
    }
    next()
}

export { tokenChecker as default, tokenValid }