import express from 'express'
import path from 'path'
import Parking from './models/parking.js'
import tokenChecker, { isAuthToken, tokenValid } from './tokenChecker.js'
import User from './models/user.js'

import multer from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "static/uploads")
    },
    filename: (rew, file, cb) => {
        console.log(file)
        cb(null, ""+  Date.now() + ".png")
    }
})
const upload = multer({storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            //return cb('Only .png, .jpg and .jpeg format allowed!');
        }
    }
})

const router = express.Router()

// Create a new parking, pass through token and upload middlewares
router.post('', [tokenChecker, upload.single("image")], async (req, res) => {
   //caricare immagine? 
   //salvataggio il percorso
    //console.log(await JSON.parse(req.body["json"]))
    if(!req.file) {
        return res.status(415).send({ message: 'Wrong file type for images' })
    }
    
    let bodyJSON = await JSON.parse(req.body["json"])
    bodyJSON.image = "uploads/"+ req.file["filename"]
    console.log("IMMMAGINE", bodyJSON.image)

    let parking = new Parking(bodyJSON)
    
    // set the owner of the parking to the logged in user
    try {
        let user = await User.findById(req.loggedInUser.userId)
        parking.owner = user
        console.log("Printing new parking", parking)
        let newParking = await parking.save()

        let parkingId = newParking._id
        newParking.self = "/api/v1/parkings/" + parkingId
        newParking = await newParking.save()

        // add reference into the user object
        user.parkings.push(newParking) //'/api/v1/parkings/' + 
        await user.save()

        // link to the newly created resource is returned in the location header
        res.location('/api/v1/parkings/' + parkingId).status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(400).send({ message: "Some fields are empty or undefined" })
    }
})

// Get all parkings of the requester
router.get('/myParkings', tokenValid, async (req, res) => {
    if (!isAuthToken(req)) {
        res.status(401).send({ message: 'Token missing or invalid' })
    } else {
        try {
            const idUser = req.loggedInUser.userId
            const user = await User.findById(idUser, { username: 0, password: 0, name: 0, surname: 0, email: 0, _id: 0, __v: 0 }).populate("parkings", { __v: 0, owner: 0 })
            /* console.log(req.params)
            const parkings = await Parking.find() */
            return res.status(200).json(user)
        } catch (err) {
            console.log(err)
            return res.status(404).send({ message: 'User not found' })
        }
    }
})

// Get a parking
router.get('/:parkingId', async (req, res) => {
    try {
        console.log("Printing parking", req.params.parkingId)
        const parking = await Parking.findById(req.params.parkingId, { __v: 0 })
        return res.status(200).json(parking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

// Get all parkings
router.get('', async (req, res) => {
    try {
        console.log(req.params)
        const parkings = await Parking.find({ $and: [{ visible: true }, { insertions: { $exists: true, $ne: [] } }] }, { visible: 0, __v: 0 })
        return res.status(200).json(parkings)
    } catch (err) {
        console.log(err)
        return res.status(500).send({ message: 'Unexpected error' })
    }
})

// Modify a parking
router.put('/:parkingId', tokenChecker, async (req, res) => {
    let validFields = ["name", "address", "city", "country", "description", "image", "latitude", "longitude", "visible"]
    for (let field in req.body) {
        if (!validFields.includes(field)) {
            return res.status(400).send({ message: "Some fields cannot be modified or do not exist" })
        }
    }
    try {
        const parking = await Parking.findById(req.params.parkingId)

        let parkingOwner = String(parking.owner)
        // if user is not the owner of the parking, return error
        if (parkingOwner.substring(parkingOwner.lastIndexOf('/') + 1) !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }

        //TODO basta mettere update senza sta colonna di if orrida
        if (req.body.name) parking.name = req.body.name
        if (req.body.address) parking.address = req.body.address
        if (req.body.city) parking.city = req.body.city
        if (req.body.country) parking.country = req.body.country
        if (req.body.description) parking.description = req.body.description
        if (req.body.image) parking.image = req.body.image
        if (req.body.latitude) parking.latitude = req.body.latitude
        if (req.body.longitude) parking.longitude = req.body.longitude
        if (req.body.visible != null) parking.visible = req.body.visible

        const updatedParking = await parking.save()
        console.log("upd", updatedParking)
        return res.status(200).json(updatedParking)
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})

// Delete a parking
router.delete('/:parkingId', tokenChecker, async (req, res) => {
    try {
        const parking = await Parking.findById(req.params.parkingId)

        let parkingOwner = parking.owner
        // if user is not the owner of the parking, return error
        if (parkingOwner.substring(parkingOwner.lastIndexOf('/') + 1) !== req.loggedInUser.userId) {
            return res.status(403).send({ message: 'User is not authorized to do this action' })
        }

        await parking.remove()
        return res.status(200).send({ message: 'Parking deleted' })
    } catch (err) {
        console.log(err)
        return res.status(404).send({ message: 'Parking not found' })
    }
})


export { router as parkings }