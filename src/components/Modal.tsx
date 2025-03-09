import React from 'react';
import styled from 'styled-components';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: #222;
  border-radius: 10px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: #FFD700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #FFD700;
  }
`;

export const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => {
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

export const ModalSection = styled.div`
  width: 100%;
  margin-bottom: 20px;
`;

export const ModalSectionTitle = styled.h3`
  color: #FFD700;
  font-size: 18px;
  margin: 20px 0 15px 0;
`;

export const ModalActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  width: 100%;
`; 