import express from 'express'

const router = express.Router()

router.get('/login', function(req,res){
    res.sendFile('./static/login.html', { root: '.'})
})

router.get('/register', function(req,res){
    res.sendFile('./static/register.html', { root: '.'})
})

//router.all('/*', (req, res) => {res.redirect('/') })

router.use('', express.static('static'))

//router.put()

//router.post()

//router.delete()

export default router