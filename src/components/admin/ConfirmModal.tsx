import React from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel'
}) => (
  <div className="adm-modal-overlay" onClick={onCancel}>
    <div className="adm-modal adm-confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="adm-modal-head">
        <h3>{title}</h3>
      </div>
      <div className="adm-modal-body">
        <p className="adm-confirm-message">{message}</p>
      </div>
      <div className="adm-modal-footer">
        <button className="adm-btn-ghost" onClick={onCancel}>{cancelText}</button>
        <button className="adm-btn-danger" onClick={onConfirm}>{confirmText}</button>
      </div>
    </div>
  </div>
);
