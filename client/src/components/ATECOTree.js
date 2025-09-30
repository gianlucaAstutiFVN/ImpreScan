import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronRight, ChevronDown, Building2 } from 'lucide-react';

const TreeContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

const TreeNode = styled.div`
  margin-bottom: 0.25rem;
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: ${props => props.selected ? '#e3f2fd' : 'transparent'};
  border: 1px solid ${props => props.selected ? '#bbdefb' : 'transparent'};
  margin-bottom: 0.25rem;
  
  &:hover {
    background: ${props => props.selected ? '#e3f2fd' : '#f8f9fa'};
    border-color: ${props => props.selected ? '#bbdefb' : '#e0e0e0'};
    transform: translateX(2px);
  }
`;

const ExpandIcon = styled.div`
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  width: 1rem;
  height: 1rem;
`;

const NodeIcon = styled(Building2)`
  margin-right: 0.5rem;
  width: 1rem;
  height: 1rem;
  color: #666;
`;

const NodeContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const NodeCode = styled.span`
  font-weight: 700;
  color: #2c3e50;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
`;

const NodeName = styled.span`
  color: #555;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  line-height: 1.3;
  font-weight: 500;
`;

const ChildrenContainer = styled.div`
  margin-left: 1.5rem;
  border-left: 1px solid #e0e0e0;
  padding-left: 0.5rem;
`;

const CompanyCount = styled.span`
  background: #3498db;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: auto;
`;

const CompanyCounts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
  gap: 0.125rem;
`;

const DirectCount = styled.span`
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TotalCount = styled.span`
  background: linear-gradient(135deg, #3498db, #5dade2);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ATECOTree = ({ data, onSelect, selectedCode }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (nodeCode) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeCode)) {
      newExpanded.delete(nodeCode);
    } else {
      newExpanded.add(nodeCode);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.code);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCode === node.code;

    return (
      <TreeNode key={node.code}>
        <NodeHeader 
          selected={isSelected}
          onClick={() => {
            onSelect(node.code);
            if (hasChildren) {
              toggleNode(node.code);
            }
          }}
        >
          <ExpandIcon>
            {hasChildren && (
              isExpanded ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
            )}
          </ExpandIcon>
          
          <NodeIcon size={16} />
          
          <NodeContent>
            <NodeCode>{node.code}</NodeCode>
            <NodeName>{node.name}</NodeName>
          </NodeContent>
          
        {(node.totalCompanies > 0 || node.directCompanies > 0 || node.leafNodes > 0) && (
          <CompanyCounts>
            {node.directCompanies > 0 && (
              <DirectCount title="Imprese dirette">
                {node.directCompanies.toLocaleString()}
              </DirectCount>
            )}
            {node.totalCompanies > 0 && (
              <TotalCount title="Totale (inclusi figli)">
                {node.totalCompanies.toLocaleString()}
              </TotalCount>
            )}
            {node.leafNodes > 0 && node.totalCompanies === 0 && (
              <TotalCount title="Sottocategorie con imprese">
                {node.leafNodes} sottocategorie
              </TotalCount>
            )}
          </CompanyCounts>
        )}
        </NodeHeader>

        {hasChildren && isExpanded && (
          <ChildrenContainer>
            {node.children.map(child => renderNode(child, level + 1))}
          </ChildrenContainer>
        )}
      </TreeNode>
    );
  };

  if (!data) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#666', 
        padding: '2rem' 
      }}>
        Caricamento classificazione ATECO...
      </div>
    );
  }

  return (
    <TreeContainer>
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem',
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Building2 size={18} color="#3498db" />
          Classificazione ATECO 2025
        </div>
        <div style={{
          fontSize: '0.9rem',
          color: '#666',
          marginBottom: '0.75rem',
          lineHeight: '1.4'
        }}>
          Seleziona un codice per filtrare le aziende
        </div>
        <div style={{ 
          fontSize: '0.8rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: '600', color: '#495057' }}>Legenda:</span>
          <DirectCount style={{ fontSize: '0.7rem' }}>Dirette</DirectCount>
          <TotalCount style={{ fontSize: '0.7rem' }}>Totali</TotalCount>
          <span style={{ 
            fontSize: '0.7rem', 
            color: '#FF9800', 
            fontWeight: 'bold',
            background: '#fff3cd',
            padding: '0.2rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>Sottocategorie</span>
        </div>
      </div>
      
      {data.map(node => renderNode(node))}
    </TreeContainer>
  );
};

export default ATECOTree;
