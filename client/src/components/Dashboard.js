import React, { useState } from 'react';
import styled from 'styled-components';
import { BarChart3, MapPin, Building2, Users } from 'lucide-react';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
`;

const DashboardHeader = styled.div`
  background: white;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const DashboardTitle = styled.h1`
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
`;

const DashboardSubtitle = styled.p`
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 1rem;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  padding: 0 1.5rem;
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  padding: 1rem 1.5rem;
  border: none;
  background: ${props => props.active ? '#3498db' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 3px solid ${props => props.active ? '#2980b9' : 'transparent'};
  
  &:hover {
    background: ${props => props.active ? '#2980b9' : '#f8f9fa'};
  }
`;

const DashboardContent = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
`;

const StatIcon = styled.div`
  margin-right: 0.5rem;
  color: ${props => props.color || '#3498db'};
`;

const ChartContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const ChartIcon = styled.div`
  margin-right: 0.5rem;
  color: #3498db;
`;

const BarChart = styled.div`
  display: flex;
  align-items: end;
  height: 250px;
  gap: 0.5rem;
  padding: 2rem 0.5rem 3rem 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem 0;
`;


const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #e0e0e0;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #2c3e50;
`;

const TableCellNumber = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  text-align: right;
  font-weight: 600;
  color: #3498db;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  border-radius: 12px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

const DashboardContentWrapper = styled.div`
  position: relative;
`;


const Dashboard = ({ companiesData, statistics, selectedAteco, loading = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('');

  const { general, byRegion, byProvince } = statistics || {};

  // Prepare data for charts
  const regionChartData = byRegion?.slice(0, 8).map(region => ({
    label: region.regione.substring(0, 12),
    value: region.total_imprese,
    fullLabel: region.regione
  })) || [];

  // Filter provinces by selected region
  const filteredProvinces = selectedRegion 
    ? byProvince?.filter(province => province.regione === selectedRegion) || []
    : byProvince || [];

  const provinceChartData = filteredProvinces.slice(0, 8).map(province => ({
    label: province.provincia.substring(0, 12),
    value: province.total_imprese,
    fullLabel: `${province.provincia} (${province.regione})`
  })) || [];

  const maxRegionValue = Math.max(...regionChartData.map(d => d.value), 1);
  const maxProvinceValue = Math.max(...provinceChartData.map(d => d.value), 1);

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>
          {selectedAteco ? `Dashboard ATECO ${selectedAteco}` : 'Dashboard Generale - Tutte le Imprese'}
        </DashboardTitle>
        <DashboardSubtitle>
          {companiesData.total.toLocaleString()} imprese totali • {byProvince?.length || 0} province coinvolte
          {selectedAteco ? ` • Filtro attivo: ${selectedAteco}` : ' • Visualizzazione generale'}
        </DashboardSubtitle>
      </DashboardHeader>

      <TabContainer>
        <Tab 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} style={{ marginRight: '0.5rem' }} />
          Panoramica
        </Tab>
        <Tab 
          active={activeTab === 'provinces'} 
          onClick={() => setActiveTab('provinces')}
        >
          <Building2 size={16} style={{ marginRight: '0.5rem' }} />
          Province
        </Tab>
      </TabContainer>

      <DashboardContentWrapper>
        <DashboardContent>
          {!selectedAteco && (
            <div style={{
              background: '#e3f2fd',
              border: '1px solid #bbdefb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#1976d2'
            }}>
              <strong>💡 Suggerimento:</strong> Seleziona un codice ATECO dall'albero a sinistra per visualizzare statistiche specifiche per quel settore. 
              Attualmente stai visualizzando i dati di tutte le imprese.
            </div>
          )}
        
        {activeTab === 'overview' && (
          <>
            <StatsGrid>
              <StatCard color="#3498db">
                <StatValue>{general?.total_imprese?.toLocaleString() || 0}</StatValue>
                <StatLabel>
                  <StatIcon color="#3498db">
                    <Users size={16} />
                  </StatIcon>
                  Imprese Totali
                </StatLabel>
              </StatCard>
              
              
              <StatCard color="#27ae60">
                <StatValue>{byProvince?.length || 0}</StatValue>
                <StatLabel>
                  <StatIcon color="#27ae60">
                    <MapPin size={16} />
                  </StatIcon>
                  Province Coinvolte
                </StatLabel>
              </StatCard>
              
              <StatCard color="#e74c3c">
                <StatValue>{byRegion?.length || 0}</StatValue>
                <StatLabel>
                  <StatIcon color="#e74c3c">
                    <Building2 size={16} />
                  </StatIcon>
                  Regioni Coinvolte
                </StatLabel>
              </StatCard>
            </StatsGrid>

            <ChartContainer>
              <ChartTitle>
                <ChartIcon>
                  <BarChart3 size={20} />
                </ChartIcon>
                Top Regioni per Imprese
              </ChartTitle>
              {regionChartData.length > 0 ? (
                <>
                  <BarChart>
                    {regionChartData.map((item, index) => {
                      const barHeight = maxRegionValue > 0 ? Math.max((item.value / maxRegionValue) * 180, 20) : 20;
                      return (
                        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                          <div style={{
                            background: 'linear-gradient(to top, #3498db, #5dade2)',
                            width: '100%',
                            height: `${barHeight}px`,
                            minHeight: '20px',
                            borderRadius: '4px 4px 0 0',
                            position: 'relative',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(to top, #2980b9, #3498db)';
                            e.target.style.transform = 'scaleY(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(to top, #3498db, #5dade2)';
                            e.target.style.transform = 'scaleY(1)';
                          }}
                          title={`${item.fullLabel}: ${item.value.toLocaleString()} imprese`}>
                            <div style={{
                              position: 'absolute',
                              top: '-1.5rem',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              color: '#2c3e50',
                              background: 'white',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.value.toLocaleString()}
                            </div>
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '-2.5rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '0.75rem',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            fontWeight: '500',
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </BarChart>
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '1rem', 
                    fontSize: '0.8rem', 
                    color: '#666' 
                  }}>
                    Hover sulle barre per vedere i dettagli completi
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#666',
                  fontSize: '1rem',
                  background: '#ffe6e6',
                  borderRadius: '4px'
                }}>
                  ❌ Nessun dato: Statistics = {statistics ? 'Present' : 'Missing'} | 
                  ByRegion = {byRegion?.length || 0} | 
                  RegionChartData = {regionChartData.length}
                </div>
              )}
            </ChartContainer>

            <TableContainer>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px 8px 0 0',
                padding: '0.75rem',
                fontSize: '0.85rem',
                color: '#495057',
                borderBottom: 'none'
              }}>
               
              </div>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Regione</TableHeader>
                    <TableHeader>Imprese Totali</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {byRegion?.map((region, index) => (
                    <TableRow key={index}>
                      <TableCell>{region.regione}</TableCell>
                      <TableCellNumber>{region.total_imprese.toLocaleString()}</TableCellNumber>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </>
        )}


        {activeTab === 'provinces' && (
          <>
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <label style={{ 
                  fontWeight: '600', 
                  color: '#495057',
                  fontSize: '0.9rem'
                }}>
                  Filtra per Regione:
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    minWidth: '200px',
                    background: 'white'
                  }}
                >
                  <option value="">Tutte le regioni</option>
                  {byRegion?.map((region, index) => (
                    <option key={index} value={region.regione}>
                      {region.regione} ({region.total_imprese.toLocaleString()} imprese)
                    </option>
                  ))}
                </select>
                {selectedRegion && (
                  <button
                    onClick={() => setSelectedRegion('')}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Cancella filtro
                  </button>
                )}
              </div>
              {selectedRegion && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.8rem', 
                  color: '#6c757d' 
                }}>
                  Mostrando province di: <strong>{selectedRegion}</strong> ({filteredProvinces.length} province)
                </div>
              )}
            </div>

            <ChartContainer>
              <ChartTitle>
                <ChartIcon>
                  <MapPin size={20} />
                </ChartIcon>
                Top Province per Imprese
              </ChartTitle>
              {provinceChartData.length > 0 ? (
                <>
                  <BarChart>
                    {provinceChartData.map((item, index) => {
                      const barHeight = maxProvinceValue > 0 ? Math.max((item.value / maxProvinceValue) * 180, 20) : 20;
                      return (
                        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                          <div style={{
                            background: 'linear-gradient(to top, #27ae60, #2ecc71)',
                            width: '100%',
                            height: `${barHeight}px`,
                            minHeight: '20px',
                            borderRadius: '4px 4px 0 0',
                            position: 'relative',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(to top, #229954, #27ae60)';
                            e.target.style.transform = 'scaleY(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(to top, #27ae60, #2ecc71)';
                            e.target.style.transform = 'scaleY(1)';
                          }}
                          title={`${item.fullLabel}: ${item.value.toLocaleString()} imprese`}>
                            <div style={{
                              position: 'absolute',
                              top: '-1.5rem',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              color: '#2c3e50',
                              background: 'white',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.value.toLocaleString()}
                            </div>
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '-2.5rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '0.75rem',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            fontWeight: '500',
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </BarChart>
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '1rem', 
                    fontSize: '0.8rem', 
                    color: '#666' 
                  }}>
                    Hover sulle barre per vedere i dettagli completi
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#666',
                  fontSize: '1rem',
                  background: '#ffe6e6',
                  borderRadius: '4px'
                }}>
                  ❌ Nessun dato: Statistics = {statistics ? 'Present' : 'Missing'} | 
                  ByProvince = {byProvince?.length || 0} | 
                  ProvinceChartData = {provinceChartData.length}
                </div>
              )}
            </ChartContainer>

            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Provincia</TableHeader>
                    <TableHeader>Regione</TableHeader>
                    <TableHeader>Imprese</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredProvinces?.map((province, index) => (
                    <TableRow key={index}>
                      <TableCell>{province.provincia}</TableCell>
                      <TableCell>{province.regione}</TableCell>
                      <TableCellNumber>{province.total_imprese.toLocaleString()}</TableCellNumber>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </>
        )}

        </DashboardContent>
        
        {loading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingText>
              {selectedAteco ? `Caricamento dati per ATECO ${selectedAteco}...` : 'Caricamento dati generali...'}
            </LoadingText>
          </LoadingOverlay>
        )}
      </DashboardContentWrapper>
    </DashboardContainer>
  );
};

export default Dashboard;
