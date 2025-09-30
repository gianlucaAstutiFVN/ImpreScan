import React from 'react';
import styled from 'styled-components';
import { Search, X } from 'lucide-react';

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  padding-right: ${props => props.hasClearButton ? '3rem' : '1rem'};
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1), 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
  
  &::placeholder {
    color: #999;
    font-weight: 400;
  }
  
  &:hover {
    border-color: #bdc3c7;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  width: 1.25rem;
  height: 1.25rem;
  transition: color 0.2s ease;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    color: #e74c3c;
    background-color: #fdf2f2;
    transform: translateY(-50%) scale(1.1);
  }
`;

const SearchBar = ({ value, onChange, placeholder = "Cerca...", onClear }) => {
  return (
    <SearchContainer>
      <SearchIcon />
      <SearchInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        hasClearButton={!!onClear}
      />
      {onClear && value && (
        <ClearButton onClick={onClear} title="Cancella ricerca">
          <X size={16} />
        </ClearButton>
      )}
    </SearchContainer>
  );
};

export default SearchBar;
