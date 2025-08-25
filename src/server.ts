import expres from 'express'

const app = expres();

app.get('/', (req, res) => {
    res.json({success: true, message: "Everything iss working fine"});
})

const port = 5001
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})