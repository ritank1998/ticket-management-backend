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

// export const sendEmail = async (req, res) => {
//   const { des, stack_id, project_id, status, email } = req.body;
//   console.log("this is the email" , email)
//   if (!des || !stack_id || !project_id ) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     // 1️⃣ Find creator (created_by) from email
//     const { data: creator, error: creatorErr } = await supabase
//       .from("users")
//       .select("user_id")
//       .eq("email", email)
//       .single();

//     if (creatorErr || !creator) {
//       return res.status(400).json({ error: "Creator not found in users table" });
//     }

//     // 2️⃣ Find assigned_to from stack_id + project_id
//     const { data: assignee, error: assigneeErr } = await supabase
//       .from("users")
//       .select("user_id")
//       .eq("stack_id", stack_id)
//       .eq("project_id", project_id)
//       .limit(1)
//       .single();

//     if (assigneeErr || !assignee) {
//       return res.status(400).json({ error: "No user found for given department and project" });
//     }

//     // 3️⃣ Insert Ticket
//     const { data: ticket, error: insertError } = await supabase
//       .from("tickets")
//       .insert([
//         {
//           ticket_description: des,
//           status: status || "Open",
//           project_id,
//           created_by: creator.user_id,
//           assigned_to: assignee.user_id,
//         },
//       ])
//       .select()
//       .single();

//     if (insertError) {
//       console.error("Error saving ticket:", insertError);
//       return res.status(500).json({ error: insertError.message });
//     }

//     // 4️⃣ Send Email
// const mailOptions = {
//   from: "rihina.techorzo@gmail.com",
//   to: email,
//   subject: "New Ticket Created",
//   // HTML template
//   html: `
//     <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
//       <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
//         <tr>
//           <td style="background-color: #1D4ED8; color: #ffffff; padding: 20px; text-align: center;">
//             <h1 style="margin: 0; font-size: 24px;">Attention !! </h1>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding: 20px;">
//             <p style="font-size: 16px; color: #333;">Hello,</p>
//             <p style="font-size: 16px; color: #333;">
//               Your ticket has been created successfully. Here are the details:
//             </p>
//             <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; border-collapse: collapse;">
//               <tr>
//                 <td style="padding: 8px; font-weight: bold; color: #555;">Description:</td>
//                 <td style="padding: 8px; color: #333;">${des}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 8px; font-weight: bold; color: #555;">Status:</td>
//                 <td style="padding: 8px; color: #333;">${ticket.status}</td>
//               </tr>
//             </table>
//             <p style="margin-top: 20px; font-size: 14px; color: #666;">
//               You can check your ticket in the dashboard anytime.
//             </p>
//             <a href="https://your-app-url.com/tickets" style="display: inline-block; padding: 10px 20px; background-color: #1D4ED8; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Ticket</a>
//           </td>
//         </tr>
//         <tr>
//           <td style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999;">
//             &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
//           </td>
//         </tr>
//       </table>
//     </div>
//   `,
// };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({
//       message: "Ticket created and email sent successfully",
//       ticket,
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };


export const sendEmail = async (req, res) => {
  const { des, stack_id, project_id, status } = req.body;

  if (!des || !stack_id || !project_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1️⃣ Find assigned user (creator) based on stack_id + project_id
    const { data: assignedUser, error: userErr } = await supabase
      .from("users")
      .select("user_id, email")
      .eq("stack_id", stack_id)
      .eq("project_id", project_id)
      .limit(1)
      .single();

    if (userErr || !assignedUser) {
      return res.status(400).json({ error: "No user found for the given stack and project" });
    }

    // 2️⃣ Insert Ticket
    const { data: ticket, error: insertError } = await supabase
      .from("tickets")
      .insert([
        {
          ticket_description: des,
          status: status || "Open",
          project_id,
          created_by: assignedUser.user_id, // assign creator automatically
          assigned_to: assignedUser.user_id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error saving ticket:", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // 3️⃣ Send Email to the user from users table
    const mailOptions = {
      from: "rihina.techorzo@gmail.com",
      to: assignedUser.email,
      subject: "New Ticket Created",
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
          <table width="100%" style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden;">
            <tr style="background-color:#1D4ED8; color:#fff;">
              <td style="padding:20px; text-align:center;"><h2>New Ticket Created</h2></td>
            </tr>
            <tr>
              <td style="padding:20px; color:#333;">
                <p>Hello,</p>
                <p>A new ticket has been created for you. Details are as follows:</p>
                <table width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px; font-weight:bold;">Description:</td>
                    <td style="padding:8px;">${des}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px; font-weight:bold;">Status:</td>
                    <td style="padding:8px;">${ticket.status}</td>
                  </tr>
                </table>
                <p style="margin-top:20px;">You can check your ticket in the dashboard anytime.</p>
                <a href="https://your-app-url.com/tickets" style="display:inline-block; padding:10px 20px; background:#1D4ED8; color:#fff; text-decoration:none; border-radius:5px;">View Ticket</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px; text-align:center; color:#999;">&copy; ${new Date().getFullYear()} Your Company</td>
            </tr>
          </table>
        </div>
      `,
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
    // 1. Verify user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ error: "User not found with given user_id" });
    }

    // 2. Verify project exists
    const { data: existingProject, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (projectError || !existingProject) {
      return res.status(404).json({ error: "Project not found with given project_id" });
    }

    // 3. Assign project to user
    const { data, error } = await supabase
      .from("users")
      .update({ project_id })
      .eq("user_id", userId)
      .select("*");

    if (error) {
      console.error("Error assigning project to user:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Project assigned to user successfully",
      user: data[0],
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
    if (!email) return res.status(400).json({ error: "Email is required" });

    // 1️⃣ Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, role_id")
      .eq("email", email)
      .single();
    if (userError || !user) return res.status(404).json({ error: "User not found" });

    if (user.role_id === 2) return res.status(403).json({ error: "Access denied" });

    // 2️⃣ Fetch tickets with creator, assignee, project names via join
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        ticket_description,
        status,
        created_at,
        completion_date,
        is_delayed,
        assigned_to,
        created_by,
        project_id
      `)
      .eq("assigned_to", user.user_id);

    if (ticketsError) return res.status(400).json({ error: ticketsError.message });

    // 3️⃣ Fetch related names manually
    const userIds = [
      ...new Set([...tickets.map(t => t.assigned_to), ...tickets.map(t => t.created_by)])
    ];
    const projectIds = [...new Set(tickets.map(t => t.project_id))];

    const { data: users } = await supabase
      .from("users")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const { data: projects } = await supabase
      .from("projects")
      .select("project_id, project_name")
      .in("project_id", projectIds);

    // 4️⃣ Map names to tickets
    const ticketsWithNames = tickets.map(t => ({
      ...t,
      assigned_user_name: users.find(u => u.user_id === t.assigned_to)?.name || null,
      creator_name: users.find(u => u.user_id === t.created_by)?.name || null,
      project_name: projects.find(p => p.project_id === t.project_id)?.project_name || null
    }));

    res.status(200).json(ticketsWithNames);

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
      subject: "Team Assignment",
      text: "Hi Yashas , You have been assigned to Talent-Go Project as a UI/UX Designer",
    };

    const response = await transporter.sendMail(mailOptions);

    console.log("Email sent:", response.messageId);
    res.status(200).json({ success: true, messageId: response.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



export const addComment = async (req, res) => {
  try {
    const { ticket_id, user_id, comment_text, parent_comment_id = null } = req.body;

    if (!ticket_id || !user_id || !comment_text) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          ticket_id,
          user_id,
          comment_text,
          parent_comment_id,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding comment:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "Comment added successfully.",
      comment: data[0],
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getTicketComments = async (req, res) => {
  try {
    // ✅ Read from query, not params
    const ticket_id = req.query.ticket_id;

    if (!ticket_id) {
      return res.status(400).json({ error: "Ticket ID is required." });
    }

    // Fetch comments with user info
    const { data, error } = await supabase
      .from("comments")
      .select(
        `comment_id, comment_text, created_at, parent_comment_id,
         users:user_id (user_id, name, email)`
      )
      .eq("ticket_id", ticket_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(200).json([]);
    }

    // 🧩 Nest comments and flatten user object
    const commentMap = {};
    const nestedComments = [];

    data.forEach((c) => {
      commentMap[c.comment_id] = {
        comment_id: c.comment_id,
        comment_text: c.comment_text,
        created_at: c.created_at,
        parent_comment_id: c.parent_comment_id,
        user_id: c.users?.user_id,
        user_email: c.users?.email,
        user_name: c.users?.name,
        replies: [],
      };
    });

    data.forEach((c) => {
      if (c.parent_comment_id) {
        // push as reply
        commentMap[c.parent_comment_id]?.replies.push(commentMap[c.comment_id]);
      } else {
        nestedComments.push(commentMap[c.comment_id]);
      }
    });

    res.status(200).json(nestedComments);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const updateTicketStatus = async (req, res) => {
  try {
    const { ticket_id, new_status, changed_by } = req.body;

    // 🔍 Validate required fields
    if (!ticket_id || !new_status || !changed_by) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 1️⃣ Fetch the existing ticket to get old status and creator info
    const { data: existingTicket, error: fetchError } = await supabase
      .from("tickets")
      .select("status, created_by, project_id")
      .eq("ticket_id", ticket_id)
      .single();

    if (fetchError || !existingTicket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const old_status = existingTicket.status;

    // 2️⃣ Fetch name of the user who changed status
    const { data: changer, error: changerError } = await supabase
      .from("users")
      .select("name, email")
      .eq("user_id", changed_by)
      .single();

    if (changerError || !changer) {
      console.warn("Could not fetch changer’s name, using ID fallback.");
    }

    const changerName = changer?.name || `User ${changed_by}`;

    // 3️⃣ Update the ticket status in tickets table
    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({ status: new_status })
      .eq("ticket_id", ticket_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating ticket status:", updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // 4️⃣ Insert a record into ticket_history (with changer’s name)
    const { error: historyError } = await supabase.from("ticket_history").insert([
      {
        ticket_id,
        old_status,
        new_status,
        changed_by_name: changerName,
        changed_by_id: changed_by,
      },
    ]);

    if (historyError) {
      console.error("Error saving history:", historyError);
      // Continue anyway
    }

    // 5️⃣ Fetch creator’s email and name
    const { data: creator, error: userError } = await supabase
      .from("users")
      .select("email, name")
      .eq("user_id", existingTicket.created_by)
      .single();

    if (userError || !creator) {
      console.warn("Could not fetch creator email, skipping email send.");
    } else {
      // 6️⃣ Send email notification
      const mailOptions = {
        from: "rihina.techorzo@gmail.com",
        to: creator.email,
        subject: "Ticket Status Updated",
        html: `
          <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
            <table width="100%" style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden;">
              <tr style="background-color:#1D4ED8; color:#fff;">
                <td style="padding:20px; text-align:center;"><h2>Ticket Status Updated</h2></td>
              </tr>
              <tr>
                <td style="padding:20px; color:#333;">
                  <p>Hello ${creator.name || ""},</p>
                  <p>Your ticket’s status has been updated by <b>${changerName}</b>.</p>
                  <table width="100%" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:8px; font-weight:bold;">Old Status:</td>
                      <td style="padding:8px;">${old_status}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px; font-weight:bold;">New Status:</td>
                      <td style="padding:8px; color:#1D4ED8;">${new_status}</td>
                    </tr>
                  </table>
                  <p style="margin-top:20px;">Please log in to your dashboard to view more details.</p>
                  <a href="https://your-app-url.com/tickets/${ticket_id}" style="display:inline-block; padding:10px 20px; background:#1D4ED8; color:#fff; text-decoration:none; border-radius:5px;">View Ticket</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px; text-align:center; color:#999;">&copy; ${new Date().getFullYear()} Your Company</td>
              </tr>
            </table>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    // 7️⃣ Respond success
    res.status(200).json({
      message: "Ticket status updated and email sent (if applicable).",
      updatedTicket,
      changedBy: changerName,
    });
  } catch (err) {
    console.error("Unexpected server error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getProjectUsers = async (req, res) => {
  try {
    const { user_id } = req.query; // or req.body if you send POST

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    // 1️⃣ Get the project_id for this user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("project_id")
      .eq("user_id", user_id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user project:", userError);
      return res.status(404).json({ error: "User or project not found" });
    }

    const projectId = userData.project_id;

    // 2️⃣ Get all users under that project
    const { data: projectUsers, error: projectUsersError } = await supabase
      .from("users")
      .select("user_id, name, email, project_role")
      .eq("project_id", projectId);

    if (projectUsersError) {
      console.error("Error fetching project users:", projectUsersError);
      return res.status(500).json({ error: "Failed to fetch project users" });
    }

    // 3️⃣ Return users (excluding self)
    const filteredUsers = projectUsers.filter((u) => u.user_id !== user_id);

    res.status(200).json({
      project_id: projectId,
      users: filteredUsers,
    });
  } catch (err) {
    console.error("Unexpected error in getProjectUsers:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};


export const mentionUsers = async (req, res) => {
  try {
    const { user_id, comment_text } = req.body;

    if (!user_id || !comment_text) {
      return res.status(400).json({ error: "Missing user_id or comment_text" });
    }

    // 1️⃣ Get the project_id of the commenter
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("project_id, name")
      .eq("user_id", user_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User or project not found" });
    }

    const projectId = userData.project_id;
    const commenterName = userData.name;

    // 2️⃣ Get all users in the same project
    const { data: projectUsers, error: projectUsersError } = await supabase
      .from("users")
      .select("user_id, name, email")
      .eq("project_id", projectId);

    if (projectUsersError) {
      return res.status(500).json({ error: "Failed to fetch project users" });
    }

    // 3️⃣ Extract mentioned names from comment text (@Name pattern)
    const mentionMatches = comment_text.match(/@([a-zA-Z0-9_]+)/g) || [];
    const mentionedNames = mentionMatches.map((m) => m.substring(1).toLowerCase());

    // 4️⃣ Find mentioned users in project (case-insensitive match)
    const mentionedUsers = projectUsers.filter((u) =>
      mentionedNames.includes(u.name.toLowerCase())
    );

    if (mentionedUsers.length === 0) {
      return res.status(200).json({ message: "No valid mentions found.", notified: [] });
    }

    // 5️⃣ Send emails to mentioned users
    for (const user of mentionedUsers) {
      const mailOptions = {
        from: "rihina.techorzo@gmail.com",
        to: user.email,
        subject: `You were mentioned in a comment`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
            <table width="100%" style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden;">
              <tr style="background-color:#1D4ED8; color:#fff;">
                <td style="padding:20px; text-align:center;">
                  <h2>You were mentioned in a comment</h2>
                </td>
              </tr>
              <tr>
                <td style="padding:20px; color:#333;">
                  <p>Hello ${user.name},</p>
                  <p><b>${commenterName}</b> mentioned you in a comment:</p>
                  <blockquote style="margin:15px 0; padding:10px 15px; border-left:3px solid #1D4ED8; background:#f1f5ff;">
                    ${comment_text}
                  </blockquote>
                  <p>Please log in to your dashboard to view more details.</p>
                  <a href="https://your-app-url.com/dashboard" 
                    style="display:inline-block; padding:10px 20px; background:#1D4ED8; color:#fff; text-decoration:none; border-radius:5px;">
                    Go to Dashboard
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px; text-align:center; color:#999;">
                  &copy; ${new Date().getFullYear()} Your Company
                </td>
              </tr>
            </table>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    // 6️⃣ Respond with success
    res.status(200).json({
      message: "Mention notifications sent successfully.",
      notified: mentionedUsers.map((u) => ({ name: u.name, email: u.email })),
    });
  } catch (err) {
    console.error("Error in mentionUsers:", err);
    res.status(500).json({ error: err.message });
  }
};