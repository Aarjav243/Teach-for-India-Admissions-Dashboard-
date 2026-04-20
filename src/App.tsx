import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import InsightsPage from './pages/InsightsPage';
import StudentListPage from './pages/StudentListPage';
import StudentFormPage from './pages/StudentFormPage';
import StudentDetailPage from './pages/StudentDetailPage';
import TeamPage from './pages/TeamPage';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/insights" element={<InsightsPage />} />
            
            <Route path="/admin">
              <Route path="students" element={<StudentListPage />} />
              <Route path="students/new" element={<StudentFormPage />} />
              <Route path="students/:id" element={<StudentDetailPage />} />
              <Route path="students/:id/edit" element={<StudentFormPage />} />
              
              <Route path="team" element={
                <ProtectedRoute allowedRoles={['program_manager']}>
                  <TeamPage />
                </ProtectedRoute>
              } />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/insights" replace />} />
          <Route path="*" element={<Navigate to="/insights" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
