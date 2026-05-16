import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import VoiceBlob from './Voiceblob';
import FBOScene from './FBOScene';
import Login from './Login';
import Signup from './Signup';
import StudentHelper from './StudentHelper';
import ChatArea from './ChatArea';
function App() {
  const isMini = window.location.search.includes("mini=true");

  return (
    <div className="App">
      <Router>
        {isMini ? (
          <Home />
        ) : (
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/voiceblob" element={<VoiceBlob />} />
            <Route path="/fbo" element={<FBOScene />} />
            <Route path="/studenthelper" element={<StudentHelper/>}/>
            <Route path="/chatarea" element={<ChatArea/>}/>
          </Routes>
        )}
      </Router>
    </div>
  );
}

export default App;