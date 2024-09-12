import express from "express";
import axios from "axios";
import oauth from 'axios-oauth-client'
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 8080;
const serviceURL = process.env.SERVICE_URL;
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const tokenUrl = process.env.TOKEN_URL;


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// consumerKey, consumerSecret and tokenUrl represent variables to which respective environment variables were read
const getClientCredentials = oauth.clientCredentials(
  axios.create(),
  tokenUrl,
  consumerKey,
  consumerSecret
);



interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

const todoList: Todo[] = [];

app.use(async (req, res, next) => {
  try {
    const auth = await getClientCredentials(undefined);
    const accessToken = auth.access_token;
    await axios.get(serviceURL!, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 10000
    });
    // await axios.get("http://localhost:8081", { timeout: 10000 });
    next();
  } catch {
    console.error("Failed to reach auth service");
    res.status(500).json({ message: "Failed to reach auth service" });
  }
});

app.get("/", async (req, res) => {
  try {
    console.log('Running "getAll"');
    res.status(200).json(todoList);
  } catch (error) {
    res.status(500).json({ message: "Error getting todos" });
  }
});

app.get("/:id", async (req, res) => {
  try {
    console.log('Running "getById"');
    const todo = todoList.find((item) => item.id === req.params.id);
    if (todo) {
      res.status(200).json(todo);
    } else {
      res.status(404).json({ message: "Todo not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error getting todo" });
  }
});

app.post("/", async (req, res) => {
  try {
    console.log('Running "create"');
    const todo: Todo = {
      ...req.body,
      id: `${new Date().getTime().toString()}_${Math.floor(
        Math.random() * 10000
      )}`,
    };
    todoList.push(todo);
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: "Error creating todo" });
  }
});

app.put("/:id", async (req, res) => {
  try {
    console.log('Running "update"');
    const todoIndex = todoList.findIndex((item) => item.id === req.params.id);
    if (todoIndex >= 0) {
      const tempItem = { ...todoList[todoIndex], ...req.body };
      todoList[todoIndex] = tempItem;
      res.status(200).json(tempItem);
    } else {
      res.status(404).json({ message: "Todo not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating todo" });
  }
});

app.delete("/:id", async (req, res) => {
  try {
    console.log('Running "delete"');
    const todoIndex = todoList.findIndex((item) => item.id === req.params.id);
    if (todoIndex >= 0) {
      todoList.splice(todoIndex, 1);
      res.status(200).json({ message: "Todo deleted" });
    } else {
      res.status(404).json({ message: "Todo not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting todo, " + error?.message });
  }
});

app.listen(port, () => {
  console.log(`API service is running on port ${port}`);
});

// todo: add middleware that calls auth service
