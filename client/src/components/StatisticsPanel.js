import React from 'react';
import styled from 'styled-components';
import { BarChart3, TrendingUp, MapPin, Building2, Users } from 'lucide-react';

const Panel = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 1rem;
  min-width: 300px;
  max-width: 400px;
  z-index: 1000;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChartContainer = styled.div`
  margin-bottom: 1rem;
`;

const ChartTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
`;

const BarChart = styled.div`
  display: flex;
  align-items: end;
  height: 100px;
  gap: 0.25rem;
`;

const Bar = styled.div`
  flex: 1;
  background: linear-gradient(to top, #3498db, #5dade2);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to top, #2980b9, #3498db);
  }
`;

const BarLabel = styled.div`
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #666;
  white-space: nowrap;
`;

const RegionList = styled.div`
  max-height: 150px;
  overflow-y: auto;
`;

const RegionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
`;

const RegionName = styled.span`
  color: #2c3e50;
`;

const RegionCount = styled.span`
  background: #3498db;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const StatisticsPanel = ({ statistics, selectedAteco }) => {
  if (!statistics) return null;

  const { general, byRegion, bySector, byProvince } = statistics;

  // Prepare data for bar chart (top regions)
  const chartData = byRegion?.slice(0, 5).map(region => ({
    label: region.regione.substring(0, 8),
    value: region.total_imprese
  })) || [];

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <Panel>
      <PanelHeader>
        <BarChart3 size={20} style={{ marginRight: '0.5rem' }} />
        <PanelTitle>Statistiche ATECO {selectedAteco}</PanelTitle>
      </PanelHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{general?.total_imprese?.toLocaleString() || 0}</StatValue>
          <StatLabel>
            <Users size={12} style={{ marginRight: '0.25rem' }} />
            Imprese Totali
          </StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{byProvince?.length?.toLocaleString() || 0}</StatValue>
          <StatLabel>
            <MapPin size={12} style={{ marginRight: '0.25rem' }} />
            Province
          </StatLabel>
        </StatCard>
      </StatsGrid>

      {chartData.length > 0 && (
        <ChartContainer>
          <ChartTitle>
            <TrendingUp size={14} style={{ marginRight: '0.5rem' }} />
            Top Regioni per Imprese
          </ChartTitle>
          <BarChart>
            {chartData.map((item, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Bar 
                  style={{ 
                    height: `${maxValue > 0 ? (item.value / maxValue) * 80 : 4}px` 
                  }}
                />
                <BarLabel>{item.label}</BarLabel>
                <div style={{ 
                  marginTop: '2rem', 
                  fontSize: '0.7rem', 
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {item.value.toLocaleString()}
                </div>
              </div>
            ))}
          </BarChart>
        </ChartContainer>
      )}

      {byProvince && byProvince.length > 0 && (
        <div>
          <ChartTitle>
            <MapPin size={14} style={{ marginRight: '0.5rem' }} />
            Top Province per Imprese
          </ChartTitle>
          <RegionList>
            {byProvince.slice(0, 10).map((province, index) => (
              <RegionItem key={index}>
                <RegionName>{province.provincia} ({province.regione})</RegionName>
                <RegionCount>{province.total_imprese.toLocaleString()}</RegionCount>
              </RegionItem>
            ))}
            {byProvince.length > 10 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '0.5rem',
                fontSize: '0.8rem',
                color: '#666'
              }}>
                ... e altre {byProvince.length - 10} province
              </div>
            )}
          </RegionList>
        </div>
      )}
    </Panel>
  );
};

export default StatisticsPanel;
