import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import IssueDetailModal from './components/IssueDetailModal';
import NewIssueModal from './components/NewIssueModal';
import Dashboard from './pages/Dashboard';
import IssuesPage from './pages/IssuesPage';
import EventsPage from './pages/EventsPage';
import ResourcesPage from './pages/ResourcesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AuthPage from './pages/AuthPage';

function CampusFlowMain() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="app-container">
      <div className="main-content">
        {/* Top Navbar */}
        <Navbar
          onOpenAuthModal={() => setShowAuthModal(true)}
          onOpenNewIssueModal={() => setShowNewIssueModal(true)}
        />

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenNewIssueModal={() => setShowNewIssueModal(true)}
          />

          {/* Main View Area */}
          <main style={{ flex: 1, minWidth: 0, paddingBottom: '3rem' }}>
            {activeTab === 'dashboard' && (
              <Dashboard
                setActiveTab={setActiveTab}
                onSelectIssue={(id) => setSelectedIssueId(id)}
                onOpenNewIssueModal={() => setShowNewIssueModal(true)}
              />
            )}

            {activeTab === 'issues' && (
              <IssuesPage
                onSelectIssue={(id) => setSelectedIssueId(id)}
                onOpenNewIssueModal={() => setShowNewIssueModal(true)}
              />
            )}

            {activeTab === 'events' && (
              <EventsPage />
            )}

            {activeTab === 'resources' && (
              <ResourcesPage />
            )}

            {activeTab === 'analytics' && (
              <AdminAnalyticsPage />
            )}
          </main>
        </div>

        {/* Global Modals & Overlays */}
        {selectedIssueId && (
          <IssueDetailModal
            issueId={selectedIssueId}
            onClose={() => setSelectedIssueId(null)}
            onIssueUpdated={() => {}}
          />
        )}

        {showNewIssueModal && (
          <NewIssueModal
            onClose={() => setShowNewIssueModal(false)}
            onIssueCreated={(newIssue) => {
              setSelectedIssueId(newIssue.id);
            }}
          />
        )}

        {showAuthModal && (
          <AuthPage onClose={() => setShowAuthModal(false)} />
        )}

        {/* Toast Notification Container */}
        <Toast />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CampusFlowMain />
    </AuthProvider>
  );
}
