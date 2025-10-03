import express from "express"
import { addProject, adminLogin, assignProjectToUser, getAllProjects, getAllProjectsList, getAllRoles, getAllStack, getAllTickets, getAllUsersForDropdown, getTicketsForUser, getUsersForDropdown, getUsersForTable, sendEmail, testEmail } from "../routes/routes.js"
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
export default router