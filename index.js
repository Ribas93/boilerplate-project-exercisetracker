const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const {Schema} = require('mongoose')
require('dotenv').config()


mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema(
{
      username: { type: String, required: true},
      log:  [{ description: String, 
              duration: Number, 
              date: String,
              _id:false }],
       count: Number
})

const User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}))

//(req,res) => {}
app.get('/', (req, res) => 
{
      res.sendFile(__dirname + '/views/index.html')
});


// PARTE 1### - criar user name!!  

// >>  esse POST [e] referente ao input para criar userName!
app.post('/api/users', (req,res) => 
{

   const{username} = req.body
     
   const user = new User({username:username})


    user.save((err,data) => {
      
    if (err)
    {
      res.json({error:err})
    }
                            })

   res.json({username:user.username, _id:user._id})

})

// >> get responsavel por retornar o arrayUsers para o usuario (por json)
app.get( '/api/users', (req,res) => 
{
  

     User.find( (err,data) => 
     {
       
       if (data)
       {
           data = data.map(a => {return {username:a.username, _id:a._id}})
           res.json(data)
       }
       
     })
    
})


// PARTE 2 ####- Adicionar Exercicios!

// >> esse post [e] responsavel por adicionar ao username, atraves do id fornecido, duracao,descricao e data, este ultimo opcional, 
//   se caso n informado utilizar data atual!
app.post('/api/users/:_id/exercises', (req,res) => 
{


    const {duration,description} = req.body
    const id = req.params._id

   

    let date = req.body.date



    if (date == '' || date === "undefined" || date === undefined)
    {
        date = new Date()
    }
    else 
    {
        date = new Date(date)
    }

    const fuso = new Date(date).getTime() + (1000*60*60*3) // adicionando 3 horas do fuso Brasileiro!

    date = new Date(fuso).toDateString()

    // 1000*60*60*horas
  
    User.findById(id, (err,user) => 
    {

         if (err) 
         {
             res.json({error:err})
         }      
         else
         {
             const exercisesList = 
             {
                duration:Number(duration),
                description:description,
                 date: date
             }


             user.log.push(exercisesList)
      
             res.json 
               ({
                  username:user.username, 
                  description: exercisesList.description,
                  duration: Number(exercisesList.duration),
                  date: exercisesList.date,
                  _id: user._id
               })

             user.save( (err,data) =>
             {
                 if (err) console.log(err)
             })
           
         }
    })

})


// PARTE 3 ####- Filtrar Exercicios

// atraves de uma Query retornar ao usuario json com id,username, count e log sendo log [{description, duration,date}]
app.get( '/api/users/:_id/logs', (req,res) =>
{
  
    let {from,to,limit} = req.query
     
    const id = req.params._id
   
   
    User.findById( {_id:id}, (err,user) =>
    {
      
         if (err) res.json({error:err})
    
         
         if (limit === undefined)
         {
             user.count = user.log.length
         }
         else
         {
             user.count = limit
         }
   
         if (user)
         {
             let result = user.log
    
             if (from)
             { 
                 from = new Date(from).getTime()

                 result = result
                 .filter((a) => 
                  { 
                    return new Date(a.date).getTime() >= from})
             }
           
             if (to)
             {
                 to = new Date(to).getTime()

                 result = result
                 .filter((a) => 
                  {
                    return new Date(a.date).getTime() <= to
                  })

             }

             result = result
             .map(a =>
             {
                return {
                         description:a.description,
                         duration: a.duration,
                         date:a.date
                       }
             })          
             .slice(0,user.count)

             user.log = result

             res.json(
             {
                _id: user._id,
                username: user.username,
                count: user.count,
                log: user.log
             })
         }
    })
  
})




const listener = app.listen(process.env.PORT || 3000, () => 
{
  console.log('Your app is listening on port ' + listener.address().port)
})