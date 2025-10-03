import CircularJson from "circular-json";
import supabase from "../db/connection/conn.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rihina.techorzo@gmail.com",
    pass: "wdufgyawvizccnwc ",
  },
});

// Function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, "ticketManagement21021998", { expiresIn: "2h" });
};

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    console.log("Token is required");
  }

  try {
    const decoded = jwt.verify(token, "ticketManagement21021998");
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("Invalid Token");
  }
};

export const sendEmail = async (req, res) => {
  const { des, stack_id, project_id, status, email } = req.body;

  if (!des || !stack_id || !project_id || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1️⃣ Find creator (created_by) from email
    const { data: creator, error: creatorErr } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .single();

    if (creatorErr || !creator) {
      return res.status(400).json({ error: "Creator not found in users table" });
    }

    // 2️⃣ Find assigned_to from stack_id + project_id
    const { data: assignee, error: assigneeErr } = await supabase
      .from("users")
      .select("user_id")
      .eq("stack_id", stack_id)
      .eq("project_id", project_id)
      .limit(1)
      .single();

    if (assigneeErr || !assignee) {
      return res.status(400).json({ error: "No user found for given department and project" });
    }

    // 3️⃣ Insert Ticket
    const { data: ticket, error: insertError } = await supabase
      .from("tickets")
      .insert([
        {
          ticket_description: des,
          status: status || "Open",
          project_id,
          created_by: creator.user_id,
          assigned_to: assignee.user_id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error saving ticket:", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // 4️⃣ Send Email
    const mailOptions = {
      from: "rihina.techorzo@gmail.com",
      to: email, // notify creator
      subject: "New Ticket Created",
      text: `Your ticket has been created.\n\nDescription: ${des}\nStatus: ${ticket.status}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Ticket created and email sent successfully",
      ticket,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const registerUsers = async (req, res) => {
  try {
    const { name, email, password, role_id, stack_id, project_role, project_id } =
      req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role_id,
          stack_id,
          project_role,
          project_id,
        },
      ])
      .select("user_id, email, role_id, stack_id")
      .single();

    if (error) {
      console.error("Error inserting user:", error);
      return res.status(400).json({ error: error.message });
    }

    const token = jwt.sign(
      {
        email: data.email,
        role_id: data.role_id,
        stack_id: data.stack_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        user_id: data.user_id,
        email: data.email,
        role_id: data.role_id,
        stack_id: data.stack_id,
      },
      token,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const loginToSystem = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, password, role_id, stack_id")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        email: user.email,
        role_id: user.role_id,
        stack_id: user.stack_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        stack_id: user.stack_id,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("master_roles")
      .select("role_id, role_name");

    if (error) {
      console.error("Error fetching roles:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getAllStack = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("master_stacks")
      .select("stack_id, stack_name");

    if (error) {
      console.error("Error fetching stacks:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, password, role_id, name")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role_id !== 1) {
      return res.status(403).json({ error: "Access denied: Not an admin" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
      },
      token,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersForTable = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, name, role_id")
      .eq("role_id", 2);

    if (error) {
      console.error("Error fetching users for table:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getUsersForDropdown = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, name")
      .eq("role_id", 2);

    if (error) {
      console.error("Error fetching users for dropdown:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const addProject = async (req, res) => {
  const { project_name, pm_id } = req.body;

  if (!project_name || !pm_id) {
    return res.status(400).json({ error: "Project name and PM ID are required" });
  }

  try {
    // 1️⃣ Insert the new project
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .insert([{ project_name, pm_id }])
      .select("*")
      .single();

    if (projectError) {
      console.error("Error adding project:", projectError);
      return res.status(400).json({ error: projectError.message });
    }

    // 2️⃣ Update the PM's project_id in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({ project_id: projectData.project_id })
      .eq("user_id", pm_id)
      .select("*")
      .single();

    if (userError) {
      console.error("Error updating PM with project_id:", userError);
      return res.status(400).json({ error: userError.message });
    }

    res.status(201).json({
      message: "Project added and PM assigned successfully",
      project: projectData,
      pm: userData,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all users for dropdown
export const getAllUsersForDropdown = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, name")
      .order("name", { ascending: true }); // optional: alphabetical order

    if (error) {
      console.error("Error fetching users for dropdown:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error fetching users for dropdown:", err);
    return res.status(500).json({ error: err.message });
  }
};


export const assignProjectToUser = async (req, res) => {
  const { userId, project_id } = req.body;

  if (!userId || !project_id) {
    return res.status(400).json({ error: "userId and project_id are required" });
  }

  try {
    // Verify if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ error: "User not found with given user_id" });
    }

    // Update project_id
    const { data, error } = await supabase
      .from("users")
      .update({ project_id })
      .eq("user_id", userId) // ✅ fixed here
      .select("*");

    if (error) {
      console.error("Error assigning project to user:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Project assigned to user successfully",
      user: data[0], // select() returns array
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: err.message });
  }
};


// API to get all projects
export const getAllProjects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("project_id, project_name");

    if (error) {
      console.error("Error fetching projects:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: err.message });
  }
};


export const getAllTickets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        project_id,
        ticket_description,
        status,
        created_at,
        completion_date,
        is_delayed,
        assigned_to,
        users!assigned_to (name, email)  -- fetch assigned user info
      `);

    if (error) {
      console.error("Error fetching tickets:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getTicketsForUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 1️⃣ Fetch user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, role_id")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ Check role_id
    if (user.role_id === 2) {
      return res.status(403).json({ error: "User is a normal user, access denied" });
    }

    // 3️⃣ Fetch tickets assigned to this user
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        project_id,
        ticket_description,
        status,
        created_at,
        completion_date,
        is_delayed,
        assigned_to,
        users!assigned_to (name, email)
      `)
      .eq("assigned_to", user.user_id);

    if (ticketsError) {
      return res.status(400).json({ error: ticketsError.message });
    }

    res.status(200).json(tickets);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getAllProjectsList = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("project_id, project_name");

    if (error) {
      console.error("Error fetching projects:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }

    res.status(200).json(data);
    
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const testEmail = async (req, res) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Missing 'to' field (receiver email)" });
  }

  try {
    const mailOptions = {
      from: "rihina.techorzo@gmail.com",
      to,
      subject: "Test Email",
      text: "This is a test email to verify SMTP configuration.",
    };

    const response = await transporter.sendMail(mailOptions);

    console.log("Email sent:", response.messageId);
    res.status(200).json({ success: true, messageId: response.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};