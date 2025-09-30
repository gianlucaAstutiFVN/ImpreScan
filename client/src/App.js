import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ATECOTree from './components/ATECOTree';
import Dashboard from './components/Dashboard';
import SearchBar from './components/SearchBar';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchATECOTree, fetchCompanies, fetchStatistics } from './services/api';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
`;

const Sidebar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen',
})`
  width: 480px;
  min-width: 480px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  
  @media (max-width: 1024px) {
    width: 420px;
    min-width: 420px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    min-width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.3s ease;
    box-shadow: 4px 0 16px rgba(0,0,0,0.2);
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const MobileOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen',
})`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const MobileMenuContainer = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const Header = styled.div`
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: #3498db;
  color: white;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;


function App() {
  const [atecoData, setAtecoData] = useState(null);
  const [companiesData, setCompaniesData] = useState({ total: 0, regionalBreakdown: [] });
  const [statistics, setStatistics] = useState(null);
  const [selectedAteco, setSelectedAteco] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if ATECO tree is in session storage
      let atecoTree;
      
      try {
        const cachedAtecoTree = sessionStorage.getItem('atecoTree');
        if (cachedAtecoTree) {
          console.log('Loading ATECO tree from session storage');
          atecoTree = JSON.parse(cachedAtecoTree);
        } else {
          throw new Error('No cached data');
        }
      } catch (cacheError) {
        console.log('Fetching ATECO tree from API (cache miss or error)');
        atecoTree = await fetchATECOTree();
        // Save to session storage
        try {
          sessionStorage.setItem('atecoTree', JSON.stringify(atecoTree));
          console.log('ATECO tree saved to session storage');
        } catch (storageError) {
          console.warn('Could not save ATECO tree to session storage:', storageError);
        }
      }
      
      const [companiesResponse, statsResponse] = await Promise.all([
        fetchCompanies(),
        fetchStatistics()
      ]);
      
      setAtecoData(atecoTree);
      // Handle new response format - calculate total from regional breakdown
      const total = companiesResponse.regionalBreakdown?.reduce((sum, region) => sum + (region.total_imprese || 0), 0) || 0;
      setCompaniesData({
        total,
        regionalBreakdown: companiesResponse.regionalBreakdown || []
      });
      setStatistics(statsResponse);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAtecoSelect = async (atecoCode) => {
    setSelectedAteco(atecoCode);
    setDashboardLoading(true);
    try {
      // Fetch both statistics and filtered companies
      const [stats, companiesResponse] = await Promise.all([
        fetchStatistics({ settore: atecoCode }),
        fetchCompanies({ settore: atecoCode })
      ]);
      
      setStatistics(stats);
      
      // Update companies with filtered data - calculate total from regional breakdown
      const total = companiesResponse.regionalBreakdown?.reduce((sum, region) => sum + (region.total_imprese || 0), 0) || 0;
      setCompaniesData({
        total,
        regionalBreakdown: companiesResponse.regionalBreakdown || []
      });
    } catch (err) {
      console.error('Error fetching data for ATECO:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setSelectedAteco(null);
    setSearchTerm('');
    setDashboardLoading(true);
    
    // Reload all data without filters
    try {
      const [companiesResponse, statsResponse] = await Promise.all([
        fetchCompanies(),
        fetchStatistics()
      ]);
      // Calculate total from regional breakdown
      const total = companiesResponse.regionalBreakdown?.reduce((sum, region) => sum + (region.total_imprese || 0), 0) || 0;
      setCompaniesData({
        total,
        regionalBreakdown: companiesResponse.regionalBreakdown || []
      });
      setStatistics(statsResponse);
    } catch (error) {
      console.error('Error reloading data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const clearAtecoCache = () => {
    sessionStorage.removeItem('atecoTree');
    console.log('ATECO tree cache cleared');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        <div className="loading-spinner" style={{ marginRight: '1rem' }}></div>
        Caricamento dati...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>Errore</h2>
          <p style={{ color: '#7f1d1d', margin: '0 0 1.5rem 0' }}>{error}</p>
          <button 
            onClick={loadInitialData}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppContainer>
        <MobileOverlay isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />
        <Sidebar isOpen={isSidebarOpen}>
                <Header>
                  <Title>ATECO Explorer</Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={clearAtecoCache}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        opacity: 0.7
                      }}
                      title="Pulisci cache ATECO"
                    >
                      🔄
                    </button>
                    <MobileMenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                      ☰
                    </MobileMenuButton>
                  </div>
                </Header>
        
        <SidebarContent>
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cerca per regione, provincia o settore..."
            onClear={() => setSearchTerm('')}
          />
          
          {selectedAteco && (
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
              borderRadius: '12px',
              border: '2px solid #bbdefb',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              marginBottom: '0.5rem'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#1976d2',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <strong style={{ 
                    color: '#1976d2',
                    fontSize: '1rem',
                    fontWeight: '700'
                  }}>
                    Filtro attivo: {selectedAteco}
                  </strong>
                </div>
                <button
                  onClick={handleClearFilters}
                  style={{
                    background: 'linear-gradient(135deg, #f44336, #e57373)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(244, 67, 54, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(244, 67, 54, 0.3)';
                  }}
                >
                  ✕ Cancella filtri
                </button>
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#555',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>📊</span>
                {companiesData.total.toLocaleString()} imprese totali
              </div>
            </div>
          )}
          
          <ATECOTree 
            data={atecoData}
            onSelect={handleAtecoSelect}
            selectedCode={selectedAteco}
          />
        </SidebarContent>
      </Sidebar>

        <MainContent>
          <MobileMenuContainer>
            <MobileMenuButton onClick={() => setIsSidebarOpen(true)}>
              ☰ Menu
            </MobileMenuButton>
          </MobileMenuContainer>
          <Dashboard 
            companiesData={companiesData}
            statistics={statistics}
            selectedAteco={selectedAteco}
            loading={dashboardLoading}
          />
        </MainContent>
    </AppContainer>
    </ErrorBoundary>
  );
}

export default App;
