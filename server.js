/********************************************************************************

* WEB322 – Assignment 04

*

* I declare that this assignment is my own work in accordance with Seneca's

* Academic Integrity Policy:

*

* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html

*

* Name: Patel Manankumar Jagdishkumar Student ID: 136666237 Date: 22-03-2024

*
-
* Published URL: https://joyous-houndstooth-crab.cyclic.app
*

********************************************************************************/
const legoData = require("./modules/legoSets");
const path = require("path");
const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('home'));

app.get('/about', (req, res) => res.render('about'));

app.get("/lego/sets", async (req,res)=>{
  try{
    if(req.query.theme){
      let sets = await legoData.getSetsByTheme(req.query.theme);
      res.render("sets", { sets: sets });
  
    }else{
      let sets = await legoData.getAllSets();
      res.render("sets", { sets: sets });
    }
  }catch(err){
    res.status(404).render("404", { message: "Unable to find requested set." });
  }

});

app.get("/lego/sets/:num", async (req,res)=>{
  try{
    let set = await legoData.getSetByNum(req.psss6*ams.num);
    res.render("set", {set: set});
  }catch(err){
    res.status(404).render("404", { message: "Unable to find requested sets." });
  }
});

app.use((req, res, next) => {
  res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for." });
});

legoData.initialize().then(()=>{
  app.listen(HTTP_PORT, () => { console.log(`server running on: http://localhost:${HTTP_PORT}`) });
}); 

