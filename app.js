//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");


const app = express();
app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});


const session = require('express-session'); ///pakage for express-session
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];


app.use(session({
    secret: 'My name is Rakesh Kundan',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());


// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://admin-rakesh:Rks887354@cluster0.9492dag.mongodb.net/todolistDB");
// const todoschema=new mongoose.Schema({
//   name:String
// });
const todoschema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", todoschema);


const item1 = new Item({
    name: "Welcome to the todolist"
});
const item2 = new Item({
    name: "hit + buttton to add new items"
});
const item3 = new Item({
    name: "<-- hit checkbox to delete items"
});

const defaultitems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    name: String,
    imgURL: String,
    items: [todoschema]
});


listSchema.plugin(passportLocalMongoose);
listSchema.plugin(findOrCreate);
const List = mongoose.model("list", listSchema);


passport.use(List.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
    // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
    List.find({ _id: id }).then(function (user) {
        // console.log(user);
        done(null, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET,
    callbackURL: "https://rakesh-todolist-zphc.onrender.com/auth/google/googlelogin"
    // callbackURL: "http://localhost:3000/auth/google/googlelogin"

},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        // console.log(email.emails[0].value);
        List.findOrCreate({ googleId: profile.id, username: profile.emails[0].value, name: profile.displayName, imgURL: profile.photos[0].value }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get("/auth/google/googlelogin",
    passport.authenticate("google", { failureRedirect: '/login' }),
    function (req, res) {
        // console.log(req.user);
        const userName = req.user.name;
        res.redirect("/" + userName);
    });



app.get("/", function (req, res) {

    if (req.isAuthenticated()) {
        console.log(req.user);
        res.redirect("/" + req.user.name);

    }
    else {
        res.render("index");
    }

});

app.get('/login', function (req, res) {
    res.render("login");
});

////register route
app.get('/register', function (req, res) {
    res.render("register");
});

app.post("/register", (req, res) => {
    List.findOne({ username: req.body.username }).then((result) => {
        if (result != null) {
            res.redirect("/login");
        }
        else {
            List.register({ username: req.body.username, name: req.body.name, items: defaultitems }, req.body.password, (err, user) => {

                if (err) {
                    console.log(err);
                    res.redirect("/register");
                }
                else {
                    passport.authenticate("local")(req, res, () => {
                        const userName = req.user.name
                        res.redirect("/" + userName);
                    });
                }

            });
        }
    })

});


app.post("/login", (req, res) => {
    const newUser = new List({
        username: req.body.username,
        password: req.body.password
    });
    req.login(newUser, function (err) {
        if (err) {
            res.redirect("/login");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/" + (req.user).name);
            });

        }
    })
});
// app.get("/",(req,res)=>{
//     res.render("index");
// });
// app.get("/login",(req,res)=>{
//     res.render("login");
// });
// app.get("/register",(req,res)=>{
//     res.render("register");
// });

// Dyanamic Routing
app.get("/:customList", (req, res) => {
    if (req.isAuthenticated()) {
        const listitem = (req.user)[0].items;
        // console.log(listitem);
        const customListname = _.capitalize(req.params.customList);
        // console.log(customListname);
        // console.log(req.user);
        if (customListname != "") {
            List.findOne({ username: (req.user)[0].username }).then(function (result) {
                // console.log(result);
                if (result == null) {
                    res.redirect("/register");
                }
                else {
                    if (result.items.length == 0) {
                        result.items = defaultitems;
                        result.save();
                    }
                    let imgurl=result.imgURL;
                    // console.log(imgurl);
                    if(imgurl==null)
                    {
                        imgurl="https://drive.google.com/uc?export=view&id=19IG0VAXEBHQcaCLIcqXjKa1qTDq6X5yp";
                    }
                    res.render("list", { listTitle: result.name, newListItems: listitem, imgid: imgurl });
                }
            });
        }

    }
    else {
        res.redirect("/login");
    }
});







app.post("/", function (req, res) {
    if (req.isAuthenticated()) {
        const itemName = req.body.newItem;
        const ListName = (req.user)[0];
        const item = new Item({
            name: itemName
        });

        List.findOne({ username: ListName.username }).then((result) => {
            if (result != null) {
                result.items.push(item);
                result.save();
                res.redirect("/" + ListName.name);
            }
            else {
                res.redirect("/login");
            }

        });
    }
    else {
        req.logout(function (err) {
            if (err) {
                console.log(err);
                res.redirect("/");
            }
            else {
                res.redirect("/");
            }

        })
    }
});
//custom posting



app.post("/delete", function (req, res) {
    if (req.isAuthenticated()) {
        const checkedItemId = req.body.checkbox;
        const ListName = (req.user)[0];
        console.log(checkedItemId);
        List.findOneAndUpdate({ username: ListName.username }, { $pull: { items: { _id: checkedItemId } } }).then((result) => {
            console.log();
        });
        res.redirect("/" + ListName.name);
    }
    else {
        res.redirect("/login");
    }
});


// app.post('/upload', function (req, res) {
//     console.log(req.files);
// });





app.post("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.log(err);
            res.clearCookie();
            res.redirect("/");
        }
        else {
            res.redirect("/");
        }

    })

});
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started successfully");
});
