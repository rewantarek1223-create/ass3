const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
const USERS_FILE = path.join(__dirname, 'users.json');


function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    const fileData = fs.readFileSync(USERS_FILE, "utf8");
    return fileData ? JSON.parse(fileData) : [];
}


function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 1. Create an API that adds a new user
app.post("/user", (req, res) => {
    const { name, age, email } = req.body;

    if (!email || !name) {
        return res.status(400).json({ message: "Name and Email are required" });
    }

    const users = readUsers();

    const emailExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
        return res.status(409).json({ message: "Email already exists" });
    }

    // توليد id متسلسل (1, 2, 3...)
    const newId = users.length > 0 
        ? Math.max(...users.map(u => Number(u.id) || 0)) + 1 
        : 1;

    const newUser = { id: String(newId), name, age, email };
    users.push(newUser);
    writeUsers(users);

    return res.status(201).json({ message: "User created successfully", user: newUser });
});

// 2. Create an API that updates an existing user's name, age, or email by their ID
app.patch("/user/:id", (req, res) => {
    const { id } = req.params;
    const { name, age, email } = req.body;

    const users = readUsers();
    const userIndex = users.findIndex(u => String(u.id) === String(id));

    if (userIndex === -1) {
        return res.status(404).json({ message: "User ID not found." });
    }

    if (email) {
        const emailExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase() && String(u.id) !== String(id));
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
    }

    const currentUser = users[userIndex];
    users[userIndex] = {
        ...currentUser,
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age }),
        ...(email !== undefined && { email })
    };

    writeUsers(users);

    if (age !== undefined && name === undefined && email === undefined) {
        return res.status(200).json({ message: "User age updated successfully." });
    }

    return res.status(200).json({ message: "User updated successfully." });
});

// 3. Create an API that deletes a User by ID
app.delete(["/user", "/user/:id"], (req, res) => {
    const id = req.params.id || req.body.id;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => String(u.id) === String(id));

    if (userIndex === -1) {
        return res.status(404).json({ message: "User ID not found." });
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    writeUsers(users);

    return res.status(200).json({ message: "User deleted successfully", user: deletedUser });
});

// 4. Create an API that gets a user by their name
app.get("/user/getByName", (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ message: "Name query parameter is required" });
    }

    const users = readUsers();
    const foundUsers = users.filter(u => u.name && u.name.toLowerCase() === name.toLowerCase());

    return res.json(foundUsers);
});

// 5. Create an API that gets all users from the JSON file
app.get("/user", (req, res) => {
    const users = readUsers();
    res.json(users);
});

// 6. Create an API that filters users by minimum age
app.get("/user/filter", (req, res) => {
    const { minAge } = req.query;
    if (!minAge) {
        return res.status(400).json({ message: "minAge query parameter is required" });
    }

    const users = readUsers();
    const filteredUsers = users.filter(u => u.age && u.age >= Number(minAge));

    return res.json(filteredUsers);
});

// 7. Create an API that gets User by ID
app.get("/user/:id", (req, res) => {
    const { id } = req.params;
    const users = readUsers();

    const user = users.find(u => String(u.id) === String(id));
    if (!user) {
        return res.status(404).json({ message: "User ID not found." });
    }

    return res.json(user);
});

// 404 Middleware
app.use((req, res) => {
    res.status(404).json({ message: "ERROR 404 - Not Found" });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
