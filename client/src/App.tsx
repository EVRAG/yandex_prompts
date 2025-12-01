import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from './routes/AdminPage';
import PlayerPage from './routes/PlayerPage';
import DisplayPage from './routes/DisplayPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayerPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
