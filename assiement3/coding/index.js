const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper function to read users from JSON file
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    const fileData = fs.readFileSync(USERS_FILE, "utf8");
    return fileData ? JSON.parse(fileData) : [];
}

// ==========================================
// 1. Create an API that adds a new user
// URL: POST /user
// ==========================================
app.post("/user", (req, res) => {
    const { name, age, email } = req.body;

    if (!email || !name) {
        return res.status(400).json({ message: "Name and Email are required" });
    }

    const users = readUsers();

    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
        return res.status(409).json({ message: "Email already exists" });
    }


    const newUser = { name, age, email };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return res.status(201).json({ message: "User created successfully", user: newUser });
});

// ==========================================
// 2. Create an API that updates an existing user by ID
// URL: PATCH /user/:id
// ==========================================
app.patch("/user/:id", (req, res) => {
    const { id } = req.params;
    const { name, age, email } = req.body;

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    if (email) {
        const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
    }

    const currentUser = users[userIndex];
    const updatedUser = {
        ...currentUser,
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age }),
        ...(email !== undefined && { email })
    };

    users[userIndex] = updatedUser;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return res.status(200).json({ message: "User updated successfully", user: updatedUser });
});

// ==========================================
// 3. Create an API that deletes a User by ID
// URL: DELETE /user{/:id}
// ==========================================
app.delete(["/user", "/user/:id"], (req, res) => {
    const id = req.params.id || req.body.id;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === String(id));

    if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return res.status(200).json({ message: "User deleted successfully", user: deletedUser });
});

// ==========================================
// 4. Create an API that gets a user by their name
// URL: GET /user/getByName
// ==========================================
app.get("/user/getByName", (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ message: "Name query parameter is required" });
    }

    const users = readUsers();
    const foundUsers = users.filter(u => u.name && u.name.toLowerCase() === name.toLowerCase());

    return res.json(foundUsers);
});

// ==========================================
// 5. Create an API that gets all users from the JSON file
// URL: GET /user
// ==========================================
app.get("/user", (req, res) => {
    const users = readUsers();
    res.json(users);
});

// ==========================================
// 6. Create an API that filters users by minimum age
// URL: GET /user/filter
// ==========================================
app.get("/user/filter", (req, res) => {
    const { minAge } = req.query;
    if (!minAge) {
        return res.status(400).json({ message: "minAge query parameter is required" });
    }

    const users = readUsers();
    const filteredUsers = users.filter(u => u.age && u.age >= Number(minAge));

    return res.json(filteredUsers);
});

// ==========================================
// 7. Create an API that gets User by ID
// URL: GET /user/:id
// ==========================================
app.get("/user/:id", (req, res) => {
    const { id } = req.params;
    const users = readUsers();

    const user = users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
});

// 404 Middleware
app.use((req, res) => {
    res.status(404).json({ message: "ERROR 404 - Not Found" });
});

app.listen(3000, () => {
    console.log("server is running on port 3000");
});