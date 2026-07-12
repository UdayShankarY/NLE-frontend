import React from 'react';

export const Modal: React.FC<{ 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode;
  large?: boolean;
}> = ({ title, onClose, children, large }) => (
  <div className="adm-modal-overlay" onClick={onClose}>
    <div className={`adm-modal${large ? ' adm-modal-large' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="adm-modal-head">
        <h3>{title}</h3>
        <button className="adm-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="adm-modal-body">{children}</div>
    </div>
  </div>
);
