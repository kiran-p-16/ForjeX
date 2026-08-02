import {Navigate,useRoutes} from "react-router-dom";
import {useAuth} from "./authContext";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import UserPublicProfile from "./components/user/UserPublicProfile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import CreateRepo from "./components/repo/CreateRepo";
import RepositoryPage from "./components/repo/Repository";
import FileViewer from "./components/repo/FileViewer";
import IssuesList from "./components/issue/IssueList";
import IssueDetails from "./components/issue/IssueDetails";
import Discover from "./components/discover/Discover";
import Collaborate from "./components/collaborate/Collaborate";

const Protected = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  const token = localStorage.getItem("token");

  if (authLoading) return null;

  if (!token || !currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};


const Public=({children})=>{
const{currentUser,authLoading}=useAuth();
if(authLoading)return null;
if(currentUser)return <Navigate to="/" replace/>;
return children;
};

const ProjectRoutes=()=>useRoutes([
{path:"/",element:<Protected><Dashboard/></Protected>},
{path:"/discover",element:<Protected><Discover/></Protected>},
{path:"/collaborate",element:<Protected><Collaborate/></Protected>},
{path:"/auth",element:<Public><Login/></Public>},
{path:"/signup",element:<Public><Signup/></Public>},
{path:"/profile",element:<Protected><Profile/></Protected>},
{ path: "/user/:id", element: <Protected><UserPublicProfile /></Protected> },
{ path: "/create", element: <Protected><CreateRepo /></Protected> },
{ path: "/repo/:id", element: <Protected><RepositoryPage /></Protected> },
{ path: "/repo/:id/view", element: <Protected><FileViewer /></Protected> },
{ path: "/repo/:id/issues", element: <Protected><IssuesList /></Protected> },
{ path: "/repo/:id/issues/:issueId", element: <Protected><IssueDetails /></Protected> },

]);

export default ProjectRoutes;
