import express from "express"
import { addComment, addProject, adminLogin, assignProjectToUser, generateOtp, getAdminDashboard, getAllProjects, getAllProjectsList, getAllRoles, getAllStack, getAllTickets, getAllUsersForDropdown, getProjectUsers, getTicketComments, getTicketsForUser, getUsersForDropdown, getUsersForTable, getUserTicketsSummary, mentionUsers, sendEmail, testEmail, updateTicketStatus, verifyOtp } from "../routes/routes.js"
import { registerUsers , loginToSystem } from "../routes/routes.js"

const router = express.Router()

router.post("/sendticket" , sendEmail)
router.post("/login" , registerUsers)
router.post("/signin" , loginToSystem)
router.get("/all_roles", getAllRoles)
router.get("/all_stacks", getAllStack)
router.post("/admin_login", adminLogin)
router.get("/get_users_table" , getUsersForTable)
router.get("/get_user_dropdown", getUsersForDropdown)
router.post("/add_project", addProject)
router.get("/getallUsers", getAllUsersForDropdown)
router.post("/updateUserProject", assignProjectToUser)
router.post("/getProject", getAllProjects)
router.get("/allTickets", getAllTickets)
router.post("/getTicketForUsers", getTicketsForUser)
router.get("/getprojectlist", getAllProjectsList)
router.post("/test_email", testEmail)
router.post("/comment", addComment)
router.get("/all-comment", getTicketComments)
router.post("/update-status", updateTicketStatus)
router.get("/get-project-users", getProjectUsers)
router.post("/mention-emails", mentionUsers)
router.post("/generate-otp", generateOtp)
router.post("/verify-otp", verifyOtp)
router.post("/admin-analytics", getAdminDashboard)
router.post("/user-summary", getUserTicketsSummary)
export default router