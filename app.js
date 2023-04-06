//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];


// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://admin-rakesh:Rks887354@cluster0.9492dag.mongodb.net/todolistDB");
// const todoschema=new mongoose.Schema({
//   name:String
// }); 
const todoschema = {
    name: String
};

const Item = mongoose.model("Item", todoschema);


const item1 = new Item({
    name: "Welcome to the todolist"
});
const item2 = new Item({
    name: "hit + buttton to add new items"
});
const item3 = new Item({
    name: "<-- hit checkbok to delete items"
});

const defaultitems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [todoschema]
}
const List = mongoose.model("list", listSchema);



app.get("/", function (req, res) {
    Item.find().then((result) => {
        if (result.length === 0) {

            //finding data from database
            Item.insertMany(defaultitems).then(() => {
                console.log("Succesfully saved");
            })
                .catch((err) => {
                    console.log("Error");
                });
            res.render("list", { listTitle: "Today", newListItems: result });
        }
        else {
            res.render("list", { listTitle: "Today", newListItems: result });
        }
    });

});

//Dyanamic Routing
app.get("/:customList", (req, res) => {
    const customListname = _.capitalize(req.params.customList);

    if (customListname != "") {
        List.find({ name: customListname }).then(function (result) {
            // console.log(result);
            if (result.length == 0) {
                const list = new List({
                    name: customListname,
                    items: defaultitems
                });
                console.log(result);
                list.save();
                // res.render("list", { listTitle: result[0].name, newListItems: result[0].items });
                setTimeout(()=>{
                res.redirect("/" + customListname);
                },1000);
            }

            
            else {
                if(result[0].items.length==0)
                {
                    result[0].items=defaultitems;
                    result[0].save(); 
                }

                // console.log(result[0]);
                // setInterval(() => {
                    res.render("list", { listTitle: result[0].name, newListItems: result[0].items });
                // }, 1000);
                
                
            }
        });
    }
});







app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const ListName = req.body.list;
    console.log(ListName);
    const item = new Item({
        name: itemName
    });
    if (ListName == "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.find({ name: ListName }).then((result) => {
            result[0].items.push(item);
            // console.log(result[0].items);
            result[0].save();

        });
        res.redirect("/" + ListName);
    }
});
//custom posting



app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const ListName = req.body.Listname;
    console.log(checkedItemId);
    if (ListName == "Today") {
        Item.deleteOne({ _id: checkedItemId }).then(function (err) {
            console.log(err); // Success
        }).catch(function (error) {
            console.log(error); // Failure
        });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({ name: ListName }, { $pull: { items: { _id: checkedItemId } } }).then((result) => {
            console.log();
        });
        res.redirect("/" + ListName);

    }
    // Item.remove(({ _id:checkedItemId}), function (err) {
    //     if (err){
    //         console.log(err)
    //     }
    //     else{
    //         console.log("Deleted Blogs");
    //     }
    //  });


});








app.get("/work", function (req, res) {
    res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
    res.render("about");
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
    console.log("Server started successfully");
});