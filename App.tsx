import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ChatView } from './views/ChatView';
import { SearchView } from './views/SearchView';
import { SettingsView } from './views/SettingsView';
import { ROUTES } from './constants';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.CHAT);

  const renderContent = () => {
    switch (currentRoute) {
      case ROUTES.CHAT:
        return <ChatView />;
      case ROUTES.SEARCH:
        return <SearchView />;
      case ROUTES.SETTINGS:
        return <SettingsView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <Layout currentRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderContent()}
    </Layout>
  );
};

export default App;