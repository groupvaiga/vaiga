import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import VoiceBlob from './Voiceblob';
import FBOScene from './FBOScene';
import Login from './Login';
import Signup from './Signup';
function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home/>} />
          <Route path="/voiceblob" element={<VoiceBlob />} />
          <Route path="/fbo" element={<FBOScene />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;