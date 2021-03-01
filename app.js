const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const _ = require('lodash')
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'))

mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true})

const itemsSchema = new mongoose.Schema ({
    name:{
        type: String,
        require: [true, "check entry.  Cannot be blank"] 
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Clean House"
});

const item2 = new Item({
    name: "do some coding"
});

const item3 = new Item({
    name: "think of something else to do"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)


app.get('/', function(req, res){

    Item.find({}, function (err, result){
        if (result.length === 0){
            Item.insertMany(defaultItems, function(err){
                if (err){
                    console.log(err)
                }else{
                    console.log("Saved default items to DB")
                }
            });
            res.redirect("/");
        }else{
            res.render("list", {listTitle: "Today", newListItems: result});
        }
    })
    
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    if (listName === "Today"){
        item.save();
    res.redirect("/");
    }else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName)
        });
    }
    
});

app.post('/delete', function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err)
            }else{
                console.log("successfully removed item")
                res.redirect("/");
            }
        });   
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundLIst){
            if(!err){
                res.redirect("/" + listName);
            }
        })
    }

    
})

app.get("/:id", function(req, res){
    const customListName = _.capitalize(req.params.id)

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName)
            }else{
                //show existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
            }
        }
    })  
});

app.listen(3000, function(){
    console.log("server is started on PORT 3000");
})