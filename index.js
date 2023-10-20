import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose";




const app = express();


let PORT = process.env.PORT;
console.log(PORT);
if (PORT == null || PORT == ""){
    PORT = 3000;
}



app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));




mongoose.connect("mongodb+srv://axel:G3isterbahn@firstdeployment.ou1zlwj.mongodb.net/?retryWrites=true&w=majority")
.then(() => {
 console.log("CONNECTION OPEN!!!")
})
.catch(err => {
 console.log("OH NO ERROR!!!")
 console.log(err)
});

const todoSchema = new mongoose.Schema({
    text: String,
    checkboxValue: Boolean
});
const Todo = mongoose.model("Todo", todoSchema);

const todo1 = new Todo({
    text: "Netflix",
    checkboxValue: false
});
const todo2 = new Todo({
    text: "Prime Video",
    checkboxValue: false
});
const todo3 = new Todo({
    text: "Chips and Schwip Schwap",
    checkboxValue: false
});

const listSchema = {
    name: String,
    todos: [todoSchema]
};
const List = mongoose.model("List", listSchema);
//---------------------------------------------------------------------------------------------------------------------//

const formattedDate = getFormattedDate();
//---------------------------------------------------------------------------------------------------------------------//

app.get("/", (req, res) => {
    Todo.find({}).then(data => {
        if (data.length > 0){
            res.render("index.ejs", {name: "Today", content: data, date: formattedDate});
        } else {
            res.render("index.ejs", {name: "Today", date: formattedDate});
        }
    })
});

app.get("/:customListName", (req, res) => {
    const customListName = capitalize(req.params.customListName);


    if (customListName != "Today"){
        List.findOne({name: customListName})
        .then(function(foundList) {
            if(!foundList){
                const list = new List({
                    name: customListName,
                    todos: [todo1, todo2, todo3]
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //list already exists -> render it:
                res.render("index.ejs", {name: customListName, content: foundList.todos, date: formattedDate});
            }
        })
        .then(function(savedList) {
            if (savedList){
                //if a new list was saved, now render it
                res.render("index.ejs", {name: customListName, content: savedList.todos, date: formattedDate})
            }
        })
        .catch(function(err) {
            console.log(err);
        });
    }
});

app.post("/add", (req, res) => {

    let nextTodoText = req.body.todo;
    nextTodoText = nextTodoText.trimLeft();
    
    const listName = req.body.addButton;
    if (listName == "Today"){
        console.log("ListName per default: " + listName);
        
        if (nextTodoText.length > 0){
            const nextTodo = new Todo({
                text: nextTodoText,
                checkboxValue: false
            });
            nextTodo.save();
        }   
        res.redirect("/");
    } else {
        List.findOne({name: listName})
        .then(function(foundList){
            if (nextTodoText.length > 0){
                const nextTodo = new Todo({
                    text: nextTodoText,
                    checkboxValue: false
                });
                foundList.todos.push(nextTodo);
                foundList.save();
            }  
        })
        .then(function (savedList){
            res.redirect("/" + listName);
        })
        .catch (function(err){
            console.log(err);
        });
    }
});

app.post("/check", (req, res) => {

    var listName = req.body.name;
    var valueFromCheckbox = req.body.mrCheck;
    var idFromForm = req.body.checkFormular //_id from todo to delete
   
    if (listName == "Today"){
        if (req.body.mrDelete){
            Todo.deleteOne({_id: req.body.mrDelete}).then(data => {
                console.log("Data deleted");
            }).then(res.redirect("/"));
        } else {
            if (valueFromCheckbox == "on"){
                Todo.updateOne(
                    {_id: idFromForm}, {$set: {checkboxValue: true}}
                ).then(data => {
                    console.log("CheckboxValue updated for ID: " + idFromForm);
                })
            } else {
                Todo.updateOne(
                    {_id: idFromForm}, {$set: {checkboxValue: false}}
                ).then(data => {
                    console.log("CheckboxValue updated for ID: " + idFromForm);
                })
            }
            res.redirect("/");
        }
    } else {
        if (req.body.mrDelete){
            List.findOneAndUpdate({name: listName}, {$pull: {todos: {_id: idFromForm}}})
            .then(() => {
                res.redirect("/" + listName);
            })
            .catch(err => {
                console.log(err);
            });

        } else {
            //console.log("Well, there is some code missing for updating the checkboxValue, Boy.");
            List.findOne({name: listName})
            .then(function(foundList){
                for (let i = 0; i < foundList.todos.length; i++){
                    if (foundList.todos[i]._id == idFromForm){
                        if (valueFromCheckbox == "on"){
                            foundList.todos[i].checkboxValue = true;
                        } else {
                            foundList.todos[i].checkboxValue = false;
                        }
                    }
                }
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(function(err){
                console.log(err);
            })
        }
    }
});

app.post("/clear", (req, res) => {

    const listName = req.body.clear;
    if (listName != "Today"){
        List.findOne({name: listName})
        .then(function(foundList){
            var toDelete = 0;
            for (let i = 0; i < foundList.todos.length; i++){
                if (foundList.todos[i].checkboxValue == true){
                    toDelete += 1;
                }
            }
            var deleted = 0;
            while (toDelete != deleted){
                for (let i = 0; i < foundList.todos.length; i++){
                    if (foundList.todos[i].checkboxValue == true){
                        foundList.todos.splice(i, 1);
                        deleted += 1;
                    }
                }
            }
            foundList.save();
        })
        .then(() => {
            res.redirect("/" + listName);
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        Todo.deleteMany({checkboxValue: true}).then(data => {
        }).then(res.redirect("/"));
    }

    /*var gesamtElemente = 0;
    var forSchleifenCounter = 0;
    var whileSchleifenCounter = 0;
    var toDelete = 0;
    for (let i = 0; i < list.length; i++){
        gesamtElemente += 1;
        if (list[i].checkboxValue == true){
            toDelete += 1;
        }
    }
    console.log("toDelete: " + toDelete);
    var deleted = 0;

    while (toDelete != deleted){
        whileSchleifenCounter += 1;
        for (let i = 0; i < list.length; i++){
            forSchleifenCounter += 1;
            if (list[i].checkboxValue == true){
                list.splice(i, 1);
                deleted += 1;
            }
        }
    }
    console.log("Elemente gesamt: " + gesamtElemente);
    console.log("For-Schleifendurchläufe: " + forSchleifenCounter);
    console.log("While-Schleifendurchläufe: " + whileSchleifenCounter);
    */
    
});

app.listen(PORT, () => {
    console.log("Server running on PORT " + PORT + " ...");
});


function getFormattedDate() {
    const options = { weekday: 'long', year: '2-digit', month: '2-digit', day: '2-digit' };
    const date = new Date();
    return date.toLocaleDateString('en-US', options);
  }
  
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }